from rest_framework import viewsets, mixins, views
from rest_framework.permissions import BasePermission, IsAuthenticated, IsAdminUser, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from django.contrib.auth.models import User, Group
from .models import Club, Member, Membership
from .serializers import *
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext as _
import datetime

class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    permission_classes = (IsAuthenticated&IsAdminUser, )
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    permission_classes = (IsAuthenticated&IsAdminUser, )
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer

class UserClubViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows clubs to be viewed, edited, or deleted.
    """
    permission_classes = (IsAuthenticated, )
    serializer_class = UserClubSerializer

    def get_queryset(self):
        queryset = User.objects.filter(id=self.request.user.id)

        return queryset

class ClubViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows clubs to be viewed, edited, or deleted.
    """
    permission_classes = (IsAuthenticated&IsAdminUser, )
    queryset = Club.objects.all().order_by('name')
    serializer_class = ClubSerializer

class MemberViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows members to be viewed, edited, or deleted.
    """
    permission_classes = (IsAuthenticated, )

    def get_queryset(self):
        queryset = Membership.objects.all()

        club = Club.objects.filter(user_id=self.request.user.id)[0]
        queryset = queryset.filter(club__id=club.id).prefetch_related('member').order_by('-created_at')

        return queryset

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return CreateUpdateMemberSerializer
        elif self.action in ('destroy'):
            return MemberSerializer
        else:
            return MembershipSerializer

    def create(self, request, *args, **kwargs):
        try:
            # create member or update if already exists
            member, created = Member.objects.update_or_create(
                andrew_id=request.data.get('andrew_id', None)
            )

            # club can only add member to its list
            club = Club.objects.filter(user_id=request.user.id)[0]

            # check if there are duplicate memberships
            try:
                duplicate = Membership.objects.get(club=club, member=member)
            except Membership.DoesNotExist:
                duplicate = None
            if duplicate is not None:
                raise ValidationError(_('You have already joined this club!'))

            Membership.objects.create(club=club, member=member)

            return Response(MemberSerializer(instance=member,
                                             context={'request': request}).data)

        except ValidationError as e:
            customized_response = {}
            customized_response['errors'] = []
            customized_response['errors'].append(e)

            return Response(data = customized_response)

    def destroy(self, request, pk=None):
        member = Member.objects.filter(id=pk)[0]
        club = Club.objects.filter(user_id=request.user.id)[0]

        Membership.objects.get(club=club, member=member).delete()

        return Response(MemberSerializer(instance=member,
                                         context={'request': request}).data)

class MemberMetrics(views.APIView):
    """
    API endpoint that retrieves metrics for benchmarking a club's membership.
    """
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )

    def get(self, request, format=None):
        club = Club.objects.filter(user_id=self.request.user.id)[0]
        all_clubs = Club.objects.all()
        all_members = Member.objects.all()

        def isInt(s):
            try:
                int(s)
                return True
            except ValueError:
                return False

        club_count = all_clubs.count()
        total_members_per_club = 0
        total_majors_per_club = 0
        total_years_per_club = 0
        years_club_count = 0
        for single_club in all_clubs:
            members_in_single_club = all_members.filter(clubs__id=single_club.id)
            # years_in_single_club = list(map(int, members_in_single_club.values_list('graduation_year', flat=True)))
            years_in_single_club = [int(y) for y in members_in_single_club.values_list('graduation_year', flat=True) if isInt(y)]

            total_members_per_club = total_members_per_club + members_in_single_club.count()
            total_majors_per_club = total_majors_per_club + members_in_single_club.values_list('primary_major', flat=True).distinct().count()
            if len(years_in_single_club) != 0:
                total_years_per_club = total_years_per_club + (sum(years_in_single_club) / len(years_in_single_club))
                years_club_count = years_club_count + 1

        # number of members in a club
        average_members = total_members_per_club / club_count
        club_members_count = all_members.filter(clubs__id=club.id).count()

        # number of unique majors in a club
        average_majors = (total_majors_per_club / club_count)
        club_majors_count = all_members.filter(clubs__id=club.id).values_list('primary_major', flat=True).distinct().count()

        # average graduation date of members in a club
        current_year = datetime.datetime.now().year
        if years_club_count == 0:
            average_years = 0
        else:
            average_years = (total_years_per_club / years_club_count) - current_year
        # club_years = list(map(int, all_members.filter(clubs__id=club.id).values_list('graduation_year', flat=True)))
        club_years = [int(y) for y in all_members.filter(clubs__id=club.id).values_list('graduation_year', flat=True) if isInt(y)]
        if len(club_years) == 0:
            club_years_average = 0
        else:
            club_years_average = (sum(club_years) / len(club_years)) - current_year
        
        content = {
            'averageMembers': round(average_members, 2),
            'clubMembers': club_members_count,
            'averageMajors': round(average_majors, 2),
            'clubMajors': club_majors_count,
            'averageYears': round(average_years, 2),
            'clubYears': round(club_years_average, 2)
        }

        return Response(content)

    @classmethod
    def get_extra_actions(cls):
        return []