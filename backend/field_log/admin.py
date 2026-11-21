from django.contrib import admin

from .models import Crop, Field, Planting, Season, WorkEntry


@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):
    list_display = ("name", "area_ha")
    search_fields = ("name",)


@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("name", "start_date", "end_date")
    search_fields = ("name",)


@admin.register(Planting)
class PlantingAdmin(admin.ModelAdmin):
    list_display = ("field", "crop", "season", "planted_on")
    list_filter = ("season", "field", "crop")
    list_select_related = ("field", "crop", "season")
    search_fields = ("field__name", "crop__name", "season__name")
    autocomplete_fields = ("field", "crop", "season")


@admin.register(WorkEntry)
class WorkEntryAdmin(admin.ModelAdmin):
    list_display = ("title", "work_date", "planting", "cost")
    list_filter = ("planting__season", "planting__field", "work_date")
    list_select_related = ("planting__field", "planting__crop", "planting__season")
    search_fields = ("title", "planting__field__name", "planting__crop__name")
    autocomplete_fields = ("planting",)
