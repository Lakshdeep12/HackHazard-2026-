import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/aegis/page-header";
import { Copy, KeyRound, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Aegisflow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, organization, security, and integrations." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="org">Organization</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="notif">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="glass p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label>Name</Label><Input defaultValue="Alex Falcon" className="mt-1" /></div>
              <div><Label>Email</Label><Input defaultValue="alex@aegisflow.io" className="mt-1" /></div>
              <div><Label>Role</Label><Input defaultValue="SOC Admin" className="mt-1" disabled /></div>
              <div><Label>Timezone</Label><Input defaultValue="UTC−05:00" className="mt-1" /></div>
            </div>
            <Button className="mt-4" style={{ background: "var(--gradient-primary)" }}>Save changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="org" className="mt-4">
          <Card className="glass p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label>Organization name</Label><Input defaultValue="Aegisflow Security, Inc." className="mt-1" /></div>
              <div><Label>Domain</Label><Input defaultValue="aegisflow.io" className="mt-1" /></div>
              <div><Label>Plan</Label><Input defaultValue="Enterprise" className="mt-1" disabled /></div>
              <div><Label>Seats</Label><Input defaultValue="48 / 100" className="mt-1" disabled /></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <Card className="glass p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Multi-factor authentication</p>
                <p className="text-xs text-muted-foreground">Require TOTP for all admin actions.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
          <Card className="glass p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Session timeout</p>
                <p className="text-xs text-muted-foreground">Auto sign-out after 30 minutes of inactivity.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
          <Card className="glass p-5">
            <p className="text-sm font-medium">Change password</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input type="password" placeholder="Current" />
              <Input type="password" placeholder="New" />
              <Input type="password" placeholder="Confirm" />
            </div>
            <Button className="mt-3" variant="outline">Update password</Button>
          </Card>
        </TabsContent>

        <TabsContent value="keys" className="mt-4">
          <Card className="glass p-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <p className="text-sm font-medium">API Keys</p>
              <Button size="sm" style={{ background: "var(--gradient-primary)" }}><Plus className="mr-1.5 h-3.5 w-3.5" />Generate key</Button>
            </div>
            <div className="divide-y divide-border">
              {[
                { name: "prod-gateway", key: "agf_live_4xZ•••••8Qa", created: "2026-04-12" },
                { name: "staging", key: "agf_test_p2K•••••mE9", created: "2026-04-30" },
              ].map((k) => (
                <div key={k.name} className="flex items-center gap-3 p-4">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{k.key} · created {k.created}</p>
                  </div>
                  <Button size="icon" variant="ghost"><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline">Revoke</Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notif" className="mt-4">
          <Card className="glass p-5 space-y-4">
            {[
              ["Critical threats", "Page on-call for severity = critical"],
              ["Provider degradation", "Alert when provider uptime < 99%"],
              ["Weekly digest", "Email summary every Monday"],
            ].map(([t, d]) => (
              <div key={t} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {["Slack", "PagerDuty", "Datadog", "Splunk", "Webhook", "S3 archive"].map((n) => (
              <Card key={n} className="glass flex items-center justify-between p-4">
                <p className="text-sm font-medium">{n}</p>
                <Button size="sm" variant="outline">Connect</Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}