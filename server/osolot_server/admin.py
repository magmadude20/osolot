from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Collective, Membership, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = (
        *DjangoUserAdmin.fieldsets,
        ("Profile", {"fields": ("email_verified",)}),
    )
    list_display = ("email", "email_verified", "is_staff")
    search_fields = ("email", "first_name", "last_name")


@admin.register(Collective)
class CollectiveAdmin(admin.ModelAdmin):
    list_display = ("name", "visibility", "admission_type")
    list_filter = ("visibility", "admission_type")
    search_fields = ("name",)


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "collective", "status", "role")
    list_filter = ("status", "role")
    search_fields = ("user__email", "collective__name")
