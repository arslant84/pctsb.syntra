"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptText, PlusCircle, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FilterBar } from "@/components/ui/FilterBar";

type Claim = {
  id: string;
  document_number?: string;
  documentNumber?: string;
  requestor: string;
  purpose: string;
  amount: number;
  status: string;
  submittedDate: string;
};

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        console.log('Fetching claims from API...');
        console.log('Current time:', new Date().toISOString());
        const response = await fetch('/api/claims');
        
        // Log the raw response for debugging
        console.log('Raw API response status:', response.status);
        console.log('Raw API response headers:', JSON.stringify(Object.fromEntries([...response.headers])));
        
        if (!response.ok) {
          throw new Error(`Error fetching claims: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched claims data:', JSON.stringify(data, null, 2));
        console.log('Data type:', typeof data);
        console.log('Data keys:', Object.keys(data));
        
        // Handle both direct array and nested claims property
        if (Array.isArray(data)) {
          console.log(`Found ${data.length} claims in direct array response`);
          if (data.length > 0) {
            console.log('First claim:', JSON.stringify(data[0], null, 2));
          }
          setClaims(data);
        } else if (data.claims && Array.isArray(data.claims)) {
          console.log(`Found ${data.claims.length} claims in nested claims property`);
          if (data.claims.length > 0) {
            console.log('First claim:', JSON.stringify(data.claims[0], null, 2));
          }
          setClaims(data.claims);
        } else {
          console.warn('No valid claims data found in response:', data);
          setClaims([]);
        }
      } catch (err) {
        console.error('Failed to fetch claims:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch claims');
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  // Filtering logic
  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      searchTerm === "" ||
      (claim.document_number || claim.documentNumber || claim.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.requestor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || claim.status === statusFilter;
    // For type, you may need to add a 'type' property to Claim if available
    const matchesType = typeFilter === "ALL" || (claim as any).type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    let variant: "default" | "destructive" | "outline" | "secondary" = "secondary";
    let icon = null;

    switch (status.toLowerCase()) {
      case 'approved':
        variant = 'default';
        icon = <CheckCircle className="w-3 h-3 mr-1" />;
        break;
      case 'rejected':
        variant = 'destructive';
        icon = <XCircle className="w-3 h-3 mr-1" />;
        break;
      case 'pending verification':
      case 'pending approval':
        variant = 'outline';
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
      default:
        variant = 'secondary';
        icon = <FileText className="w-3 h-3 mr-1" />;
        break;
    }
    return <Badge variant={variant}>{icon} {status}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ReceiptText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Expense Claims</h1>
        </div>
        <Link href="/claims/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" /> Submit New Claim
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <FilterBar
                    searchPlaceholder="Search by Claimant, TSR ID, Purpose..."
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusOptions={[
          { value: "ALL", label: "All Statuses" },
          { value: "Pending Verification", label: "Pending Verification" },
          { value: "Approved", label: "Approved" },
          { value: "Rejected", label: "Rejected" },
        ]}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeOptions={[
          { value: "ALL", label: "All Claim Types" },
          { value: "Travel", label: "Travel" },
          { value: "Accommodation", label: "Accommodation" },
          { value: "Other", label: "Other" },
        ]}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {/* Claims Overview Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            My Claims
          </CardTitle>
          <CardDescription>List of your submitted expense claims and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <p>Error: {error}</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <ReceiptText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No claims found.</p>
              <p className="text-sm text-muted-foreground">Click "Submit New Claim" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.document_number || claim.documentNumber || claim.id}</TableCell>
                      <TableCell>{claim.purpose}</TableCell>
                      <TableCell>USD {claim.amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>{claim.submittedDate ? format(new Date(claim.submittedDate), 'dd MMM yyyy') : '-'}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/claims/view/${claim.id}`}>
                            <FileText className="w-4 h-4 mr-1" /> View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
