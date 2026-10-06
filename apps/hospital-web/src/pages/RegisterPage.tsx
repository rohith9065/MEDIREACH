import { FormEvent, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { TextField } from "../components/TextField";
import { Button } from "../components/Button";

export function RegisterPage() {
  const { user, isLoading, registerHospital } = useAuth();
  const navigate = useNavigate();

  const [hospitalName, setHospitalName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerHospital({
        hospitalName,
        registrationNumber,
        phone: phone || undefined,
        address: address || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        adminName,
        adminEmail,
        adminPassword,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl text-ink">MediReach</h1>
          <p className="mt-1 text-sm text-ink-muted">Register Your Hospital</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 border border-rule-subtle p-6">
          <TextField
            label="Hospital name"
            required
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
          />
          <TextField
            label="Registration number"
            required
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
          />
          <TextField label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Latitude (optional)"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <TextField
              label="Longitude (optional)"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
          <p className="text-xs text-ink-muted">
            Coordinates are optional, but without them your hospital won't appear on the patient map once verified.
          </p>

          <div className="border-t border-rule-subtle pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">Your admin account</p>
            <div className="space-y-4">
              <TextField
                label="Full name"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="new-password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-status-unavailable">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Registering…" : "Register hospital"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-ink-muted">
          Already registered? <Link to="/login" className="text-ink underline">Sign in</Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-muted">
          Your hospital stays hidden from patients until a super admin verifies it — you can start setting up your
          profile right away.
        </p>
      </div>
    </div>
  );
}
