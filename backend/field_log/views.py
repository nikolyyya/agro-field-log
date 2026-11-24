from decimal import ROUND_HALF_UP, Decimal
from itertools import groupby

from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from .models import Field, Planting, Season, WorkEntry
from .permissions import CanViewCostReport, JournalModelPermissions
from .serializers import (
    CostReportSerializer,
    FieldSerializer,
    PlantingSerializer,
    SeasonSerializer,
    WorkEntryFiltersSerializer,
    WorkEntrySerializer,
)


class FieldViewSet(ReadOnlyModelViewSet):
    permission_classes = (JournalModelPermissions,)
    serializer_class = FieldSerializer
    queryset = Field.objects.all()
    lookup_value_converter = "int"


class SeasonViewSet(ReadOnlyModelViewSet):
    permission_classes = (JournalModelPermissions,)
    serializer_class = SeasonSerializer
    queryset = Season.objects.all()
    lookup_value_converter = "int"


class PlantingViewSet(ReadOnlyModelViewSet):
    permission_classes = (JournalModelPermissions,)
    serializer_class = PlantingSerializer
    queryset = Planting.objects.select_related("crop")
    lookup_value_converter = "int"


class WorkEntryViewSet(ModelViewSet):
    permission_classes = (JournalModelPermissions,)
    serializer_class = WorkEntrySerializer
    queryset = WorkEntry.objects.select_related("planting__season")
    lookup_value_converter = "int"

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        if self.action != "list":
            return queryset

        filters = WorkEntryFiltersSerializer(data=self.request.query_params)
        filters.is_valid(raise_exception=True)
        return queryset.filter(
            **{f"planting__{name}_id": value for name, value in filters.validated_data.items()}
        )


class CostReportView(GenericAPIView):
    permission_classes = (CanViewCostReport,)
    serializer_class = CostReportSerializer

    def get(self, request):
        filters = WorkEntryFiltersSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        plantings = Planting.objects.filter(
            **{f"{name}_id": value for name, value in filters.validated_data.items()}
        )
        rows = plantings.order_by("field_id", "season_id").values_list(
            "field_id", "field__name", "season_id", "season__name",
            "field__area_ha", "work_entries__cost",
        )

        def field_season(row):
            return row[:5]

        report = []
        cents = Decimal("0.01")
        for (field, field_name, season, season_name, area), entries in groupby(
            rows.iterator(), key=field_season
        ):
            # Sum Decimal values in Python to avoid SQLite's floating-point SUM.
            total = sum((row[5] for row in entries if row[5] is not None), Decimal("0.00"))
            cost_per_ha = (total / area).quantize(cents, rounding=ROUND_HALF_UP)
            report.append({
                "field": field,
                "field_name": field_name,
                "season": season,
                "season_name": season_name,
                "area_ha": format(area, ".2f"),
                "total_cost": format(total, ".2f"),
                "cost_per_ha": format(cost_per_ha, ".2f"),
            })
        return Response(self.get_serializer(report, many=True).data)
