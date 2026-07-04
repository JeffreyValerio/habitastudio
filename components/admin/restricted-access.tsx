import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export function RestrictedAccess({
  title = "Acceso Restringido",
  message = "Solo los administradores pueden ver esta sección.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
              {title}
            </h3>
            <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
