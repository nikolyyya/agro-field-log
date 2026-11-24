from rest_framework import serializers

from .models import Field, Planting, Season, WorkEntry


SQLITE_MAX_ID = 2**63 - 1


class FieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = ("id", "name", "area_ha")


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ("id", "name", "start_date", "end_date")


class PlantingSerializer(serializers.ModelSerializer):
    crop_name = serializers.CharField(source="crop.name", read_only=True)

    class Meta:
        model = Planting
        fields = ("id", "field", "crop", "crop_name", "season", "planted_on")


class WorkEntrySerializer(serializers.ModelSerializer):
    planting = serializers.PrimaryKeyRelatedField(
        queryset=Planting.objects.select_related("season"),
        pk_field=serializers.IntegerField(min_value=1, max_value=SQLITE_MAX_ID),
    )
    field = serializers.IntegerField(source="planting.field_id", read_only=True)
    season = serializers.IntegerField(source="planting.season_id", read_only=True)

    class Meta:
        model = WorkEntry
        fields = ("id", "planting", "field", "season", "work_date", "title", "cost", "notes")

    def validate(self, attrs):
        planting = attrs.get("planting", getattr(self.instance, "planting", None))
        work_date = attrs.get("work_date", getattr(self.instance, "work_date", None))
        season = planting.season
        if not season.start_date <= work_date <= season.end_date:
            raise serializers.ValidationError(
                {"work_date": "Дата работы должна быть в пределах сезона выбранного посева."}
            )
        return attrs


class WorkEntryFiltersSerializer(serializers.Serializer):
    field = serializers.IntegerField(min_value=1, max_value=SQLITE_MAX_ID, required=False)
    season = serializers.IntegerField(min_value=1, max_value=SQLITE_MAX_ID, required=False)


class CostReportSerializer(serializers.Serializer):
    field = serializers.IntegerField()
    field_name = serializers.CharField()
    season = serializers.IntegerField()
    season_name = serializers.CharField()
    area_ha = serializers.CharField()
    total_cost = serializers.CharField()
    cost_per_ha = serializers.CharField()
