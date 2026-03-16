import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  ExternalLink,
  PenTool,
  Save,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { CompanyProfile } from "../../backend.d";
import { useDataStore } from "../../dataStore";

interface Props {
  onGoToCustomerPortal: () => void;
}

export default function Profile({ onGoToCustomerPortal }: Props) {
  const { profile, updateProfile, clearAllData } = useDataStore();
  const [localProfile, setLocalProfile] = useState<CompanyProfile>({
    ...profile,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signPreview, setSignPreview] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  const handleFilePreview = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (s: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));

    if (newPass) {
      if (newPass !== confirmPass) {
        toast.error("Passwords don't match");
        setSaving(false);
        return;
      }
      // Verify old password via profile hash
      if (oldPass !== profile.adminPasswordHash) {
        toast.error("Old password incorrect");
        setSaving(false);
        return;
      }
      // Store new password in profile
      localProfile.adminPasswordHash = newPass;
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
      toast.success("Password updated!");
    }

    updateProfile(localProfile);
    toast.success("Profile saved successfully!");
    setSaving(false);
  };

  const handleResetAllData = async () => {
    setResetting(true);
    try {
      await clearAllData();
      toast.success("All data has been reset. The system is now clean.");
    } catch {
      toast.error("Failed to reset data. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  const SectionHeader = ({
    icon: Icon,
    title,
  }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(249,115,22,0.1)" }}
      >
        <Icon size={16} style={{ color: "#f97316" }} />
      </div>
      <h3 className="font-semibold font-display text-base">{title}</h3>
    </div>
  );

  return (
    <div data-ocid="profile.section" className="p-4 lg:p-6 space-y-6 max-w-3xl">
      {/* Company Details */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <SectionHeader icon={Building2} title="Company Details" />
        <p className="text-sm text-muted-foreground mb-4">
          These details will appear on all invoices, statements, and PDF
          downloads.
        </p>

        <div className="mb-5">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4 mt-2">
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center"
              style={{ background: "#f8fafc" }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src="/assets/generated/ganesh-suppliers-logo-transparent.dim_300x300.png"
                  alt="logo"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <Button
              data-ocid="profile.logo.upload_button"
              size="sm"
              variant="outline"
              onClick={() => logoRef.current?.click()}
            >
              <Upload size={14} className="mr-1" /> Upload Logo
            </Button>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFilePreview(e, setLogoPreview)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="co-name">Company Name</Label>
            <Input
              data-ocid="profile.company_name_input"
              id="co-name"
              value={localProfile.companyName}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, companyName: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="co-gst">GST Number</Label>
            <Input
              data-ocid="profile.gst_input"
              id="co-gst"
              value={localProfile.gstNumber}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, gstNumber: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="co-contact">Contact Number</Label>
            <Input
              data-ocid="profile.contact_input"
              id="co-contact"
              value={localProfile.contact}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, contact: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="co-email">Email</Label>
            <Input
              data-ocid="profile.email_input"
              id="co-email"
              type="email"
              value={localProfile.email}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, email: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="co-addr">Address</Label>
            <Input
              data-ocid="profile.address_input"
              id="co-addr"
              value={localProfile.address}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, address: e.target.value }))
              }
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Master Admin */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <SectionHeader icon={User} title="Master Admin Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>User ID</Label>
            <Input
              value={localProfile.adminUserId}
              readOnly
              className="mt-1 bg-muted"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Input value="Admin" readOnly className="mt-1 bg-muted" />
          </div>
        </div>
        <Separator className="my-4" />
        <p className="text-sm font-medium mb-3">Change Password</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Current Password</Label>
            <Input
              type="password"
              placeholder="••••••"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              placeholder="••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              placeholder="••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <Button
          data-ocid="profile.password.change_button"
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={handleSave}
        >
          Update Password
        </Button>
      </div>

      {/* Banking Details */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <SectionHeader icon={CreditCard} title="Banking Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Account Number</Label>
            <Input
              data-ocid="profile.bank_account_input"
              value={localProfile.bankAccountNumber}
              onChange={(e) =>
                setLocalProfile((p) => ({
                  ...p,
                  bankAccountNumber: e.target.value,
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>Account Name</Label>
            <Input
              value={localProfile.bankAccountName}
              onChange={(e) =>
                setLocalProfile((p) => ({
                  ...p,
                  bankAccountName: e.target.value,
                }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>Bank Name</Label>
            <Input
              value={localProfile.bankName}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, bankName: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>IFSC Code</Label>
            <Input
              data-ocid="profile.ifsc_input"
              value={localProfile.ifscCode}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, ifscCode: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>UPI ID</Label>
            <Input
              data-ocid="profile.upi_id_input"
              value={localProfile.upiId}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, upiId: e.target.value }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>Branch Name</Label>
            <Input
              value={localProfile.branchName}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, branchName: e.target.value }))
              }
              className="mt-1"
            />
          </div>
        </div>

        {/* UPI QR */}
        <div className="mt-4">
          <Label>UPI QR Code Image</Label>
          <div className="flex items-center gap-4 mt-2">
            <div
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center"
              style={{ background: "#f8fafc" }}
            >
              {qrPreview ? (
                <img
                  src={qrPreview}
                  alt="QR"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-xs text-muted-foreground text-center">
                  QR Code
                </span>
              )}
            </div>
            <Button
              data-ocid="profile.upi_qr.upload_button"
              size="sm"
              variant="outline"
              onClick={() => qrRef.current?.click()}
            >
              <Upload size={14} className="mr-1" /> Upload QR
            </Button>
            <input
              ref={qrRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFilePreview(e, setQrPreview)}
            />
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <SectionHeader icon={PenTool} title="Authorised Signature" />
        <p className="text-sm text-muted-foreground mb-4">
          This signature will appear on all invoices and statements generated
          from this portal.
        </p>
        <div className="flex items-center gap-4">
          <div
            className="w-48 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center"
            style={{ background: "#f8fafc" }}
          >
            {signPreview ? (
              <img
                src={signPreview}
                alt="Signature"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                Signature Preview
              </span>
            )}
          </div>
          <Button
            data-ocid="profile.signature.upload_button"
            size="sm"
            variant="outline"
            onClick={() => signRef.current?.click()}
          >
            <Upload size={14} className="mr-1" /> Upload Signature
          </Button>
          <input
            ref={signRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFilePreview(e, setSignPreview)}
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border-2 border-red-200 shadow-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="font-semibold text-red-600">Danger Zone</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete all customers, products, orders, and payments. Your
          admin login and company name will be preserved. This action cannot be
          undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-ocid="profile.reset_data.open_modal_button"
              variant="destructive"
              size="sm"
              className="gap-2"
              disabled={resetting}
            >
              <Trash2 size={14} />
              {resetting ? "Resetting..." : "Reset All Data"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="profile.reset_data.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle size={18} /> Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete ALL customers, products, orders,
                and payments from the system. Your admin login
                (pushpak38517@gmail.com) and company name will be kept. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="profile.reset_data.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="profile.reset_data.confirm_button"
                onClick={handleResetAllData}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Reset Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          data-ocid="profile.save.submit_button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Save size={15} className="mr-1.5" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
        <Button
          data-ocid="profile.customer_portal.link"
          variant="outline"
          onClick={onGoToCustomerPortal}
          className="gap-2"
        >
          <ExternalLink size={15} />
          Go to Customer Portal
        </Button>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground pb-4">
        © {new Date().getFullYear()} Ganesh Suppliers. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
