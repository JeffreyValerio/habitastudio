"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { useToast } from "@/hooks/use-toast";
import { setRolePermission } from "@/app/actions/role-permissions";
import {
  CONFIGURABLE_ROLES,
  CONFIGURABLE_ROLE_LABELS,
  PERMISSION_SECTIONS_BY_ROLE,
  type ConfigurableRole,
} from "@/lib/permissions";

export function RolePermissionsForm({
  initialPermissions,
}: {
  initialPermissions: Record<ConfigurableRole, Record<string, boolean>>;
}) {
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState<ConfigurableRole>("moderator");
  const [permissions, setPermissions] = useState(initialPermissions);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const roleTabs = CONFIGURABLE_ROLES.map((role) => ({
    key: role,
    label: CONFIGURABLE_ROLE_LABELS[role],
    count: PERMISSION_SECTIONS_BY_ROLE[role].length,
  }));

  const sections = PERMISSION_SECTIONS_BY_ROLE[activeRole];
  const sectionsByGroup = sections.reduce<Record<string, typeof sections>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  const handleToggle = async (section: string, enabled: boolean) => {
    const savingId = `${activeRole}:${section}`;
    setSavingKey(savingId);
    const previous = permissions[activeRole][section];

    setPermissions((prev) => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], [section]: enabled },
    }));

    try {
      await setRolePermission(activeRole, section, enabled);
    } catch (error: any) {
      setPermissions((prev) => ({
        ...prev,
        [activeRole]: { ...prev[activeRole], [section]: previous },
      }));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <FilterTabs tabs={roleTabs} active={activeRole} onChange={(key) => setActiveRole(key as ConfigurableRole)} />

      <div className="space-y-4">
        {Object.entries(sectionsByGroup).map(([group, groupSections]) => (
          <Card key={group}>
            <CardContent className="pt-6 space-y-1">
              <p className="text-sm font-semibold text-muted-foreground mb-3">{group}</p>
              {groupSections.map((s) => {
                const savingId = `${activeRole}:${s.key}`;
                const enabled = permissions[activeRole][s.key] ?? true;
                return (
                  <div key={s.key} className="flex items-center justify-between py-2">
                    <span className="text-sm">{s.label}</span>
                    <Switch
                      checked={enabled}
                      disabled={savingKey === savingId}
                      onCheckedChange={(checked) => handleToggle(s.key, checked)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
