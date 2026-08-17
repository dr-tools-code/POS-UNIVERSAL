'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Loader2, AlertCircle, Building2 } from 'lucide-react';

export default function OnboardingPage() {
  const { user, loading, companies, refreshCompanies } = useAuth();
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (companies.length > 0) {
      router.replace('/dashboard');
    }
  }, [user, loading, companies, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;

    setSubmitting(true);

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        currency,
        tax_rate: parseFloat(taxRate) || 0,
      })
      .select()
      .single();

    if (companyError || !company) {
      setError(companyError?.message || 'Failed to create company. Please try again.');
      setSubmitting(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: company.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      setError(memberError.message);
      setSubmitting(false);
      return;
    }

    await refreshCompanies();
    router.replace('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Store className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Set up your business</h1>
            <p className="text-sm text-muted-foreground">Create your company workspace to get started</p>
          </div>
        </div>

        <Card className="shadow-xl border-border/60">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Company details
            </CardTitle>
            <CardDescription>This information appears on your receipts and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Business name</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Corner Coffee Shop"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                  <option value="CAD">CAD — Canadian Dollar (C$)</option>
                  <option value="AUD">AUD — Australian Dollar (A$)</option>
                  <option value="JPY">JPY — Japanese Yen (¥)</option>
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="PHP">PHP — Philippine Peso (₱)</option>
                  <option value="AED">AED — UAE Dirham (د.إ)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default tax rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">You can override this per product later</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating workspace...</>
                ) : (
                  'Create workspace'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
