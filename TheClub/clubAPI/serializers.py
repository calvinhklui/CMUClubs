from rest_framework import serializers
from django.contrib.auth.models import User, Group
from .models import Club, Member, Membership

class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ('url', 'name')

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'groups')

class ClubSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Club
        fields = ('name',
                  'category',
                  'created_at')

class UserClubSerializer(serializers.HyperlinkedModelSerializer):
    club = ClubSerializer()

    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'club')

class CreateUpdateMemberSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Member
        fields = ('andrew_id', )

class MemberSerializer(serializers.HyperlinkedModelSerializer):
    clubs = ClubSerializer(many=True)

    class Meta:
        model = Member
        fields = ('id',
                  'andrew_id',
                  'first_name',
                  'last_name',
                  'email',
                  'home_college',
                  'primary_major',
                  'graduation_year',
                  'clubs',
                  'created_at')

class MembershipSerializer(serializers.HyperlinkedModelSerializer):
    club = ClubSerializer(many=False)
    member = MemberSerializer(many=False)

    class Meta:
        model = Membership
        fields = ('club',
                  'member',
                  'created_at',
                  'modified_at')