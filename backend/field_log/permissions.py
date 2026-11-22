from rest_framework.permissions import SAFE_METHODS, BasePermission, DjangoModelPermissions


class JournalModelPermissions(DjangoModelPermissions):
    perms_map = {
        **DjangoModelPermissions.perms_map,
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": ["%(app_label)s.view_%(model_name)s"],
    }


class CanViewCostReport(BasePermission):
    def has_permission(self, request, view):
        return (
            request.method in SAFE_METHODS
            and request.user.is_authenticated
            and request.user.has_perm("field_log.view_cost_report")
        )
