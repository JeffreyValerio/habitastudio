"use client";

import { Fragment, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { setRolePermission } from "@/app/actions/role-permissions";
import {
  CONFIGURABLE_ROLES,
  CONFIGURABLE_ROLE_LABELS,
  PERMISSION_SECTIONS_BY_ROLE,
  type ConfigurableRole,
} from "@/lib/permissions";

interface SectionRow {
  key: string;
  label: string;
  group: string;
  role: ConfigurableRole;
}

export function RolePermissionsForm({
  initialPermissions,
}: {
  initialPermissions: Record<ConfigurableRole, Record<string, boolean>>;
}) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState(initialPermissions);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Cada sección pertenece a un único rol (los portales no se comparten),
  // así que armamos una sola lista con todas para mostrarlas en una matriz
  // sección × rol, en vez de una pestaña separada por rol.
  const allSections: SectionRow[] = CONFIGURABLE_ROLES.flatMap((role) =>
    PERMISSION_SECTIONS_BY_ROLE[role].map((s) => ({ ...s, role }))
  );

  const sectionsByGroup = allSections.reduce<Record<string, SectionRow[]>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  const handleToggle = async (role: ConfigurableRole, section: string, enabled: boolean) => {
    const savingId = `${role}:${section}`;
    setSavingKey(savingId);
    const previous = permissions[role][section];

    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [section]: enabled },
    }));

    try {
      const result = await setRolePermission(role, section, enabled);
      if (!result.ok) {
        setPermissions((prev) => ({
          ...prev,
          [role]: { ...prev[role], [section]: previous },
        }));
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      setPermissions((prev) => ({
        ...prev,
        [role]: { ...prev[role], [section]: previous },
      }));
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sección</TableHead>
              {CONFIGURABLE_ROLES.map((role) => (
                <TableHead key={role} className="text-center">
                  {CONFIGURABLE_ROLE_LABELS[role]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(sectionsByGroup).map(([group, groupSections]) => (
              <Fragment key={group}>
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={CONFIGURABLE_ROLES.length + 1}
                    className="py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/40"
                  >
                    {group}
                  </TableCell>
                </TableRow>
                {groupSections.map((s) => (
                  <TableRow key={s.key}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    {CONFIGURABLE_ROLES.map((role) => {
                      const savingId = `${role}:${s.key}`;
                      const applies = role === s.role;
                      return (
                        <TableCell key={role} className="text-center">
                          {applies ? (
                            <Switch
                              checked={permissions[role][s.key] ?? true}
                              disabled={savingKey === savingId}
                              onCheckedChange={(checked) => handleToggle(role, s.key, checked)}
                              className="mx-auto"
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
