from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = (*DjangoUserAdmin.fieldsets, ("Profile", {"fields": ("name",)}))
    list_display = ("username", "email", "name", "is_staff")
    search_fields = ("username", "email", "name")
