from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from .selections import Categories
from .helpers import lookup
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext as _

class Club(models.Model):
    name = models.CharField(max_length=200, unique=True)
    category = models.CharField(max_length=200, choices=[(option.name, option.value) for option in Categories])

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    created_at = models.DateTimeField(editable=False, blank=True, null=True)
    modified_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # automatically update created_at and modified_at
        if not self.id: self.created_at = timezone.now()
        self.modified_at = timezone.now()
        return super(Club, self).save(*args, **kwargs)

class Member(models.Model):
    andrew_id = models.CharField(max_length=200, unique=True)

    first_name = models.CharField(max_length=200, blank=True, null=True)
    last_name = models.CharField(max_length=200, blank=True, null=True)
    email = models.CharField(max_length=200, blank=True, null=True)
    home_college = models.CharField(max_length=200, blank=True, null=True)
    primary_major = models.CharField(max_length=200, blank=True, null=True)
    graduation_year = models.CharField(max_length=200, blank=True, null=True)

    clubs = models.ManyToManyField(Club,
        blank=True,
        through='Membership',
        through_fields=('member', 'club')
    )

    created_at = models.DateTimeField(editable=False, blank=True, null=True)
    modified_at = models.DateTimeField(blank=True, null=True)

    def clean(self, *args, **kwargs):
        # call helper to scrape CMU directory
        directory = lookup(self.andrew_id)

        # andrew_id exists
        if directory[0]:
            member_values = directory[1]
            self.first_name = member_values.get('first_name', None)
            self.last_name = member_values.get('last_name', None)
            self.email = member_values.get('email', None)
            self.home_college = member_values.get('home_college', None)
            self.primary_major = member_values.get('primary_major', None)
            self.graduation_year = member_values.get('graduation_year', None)

        # andrew_id does not exist
        else:
            raise ValidationError(_("You entered an invalid Andrew ID."))
        super(Member, self).clean(*args, **kwargs)

    def save(self, *args, **kwargs):
        # automatically update created_at and modified_at
        if not self.id: self.created_at = timezone.now()
        self.modified_at = timezone.now()

        # invoke andrew_id validation via directory lookup
        self.full_clean()
        return super(Member, self).save(*args, **kwargs)

class Membership(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    created_at = models.DateTimeField(editable=False, auto_now_add=True, blank=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, blank=True, null=True)