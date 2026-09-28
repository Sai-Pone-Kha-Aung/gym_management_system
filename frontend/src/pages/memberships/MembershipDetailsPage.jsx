import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { membershipsApi } from "../../api/memberships.api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import { formatDate } from "../../utils/dateUtils";
import { formatCurrency, formatPhone } from "../../utils/formatters";

export const MembershipDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMembership = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await membershipsApi.getById(id);
      setMembership(data?.membership || data);
    } catch (err) {
      console.error("Error loading membership details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const handleToggleStatus = async () => {
    if (!membership) return;
    const newStatus =
      membership.status === "ACTIVE" ? "CANCELLED" : "ACTIVE";
    setActionLoading(true);
    try {
      await membershipsApi.update(id, { status: newStatus });
      fetchMembership();
    } catch (err) {
      alert(err.message || "Failed to update membership status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await membershipsApi.delete(id);
      setIsDeleteOpen(false);
      navigate("/memberships");
    } catch (err) {
      alert(err.message || "Failed to cancel/remove membership");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-800">
          Membership Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          The requested membership record could not be found or has been removed.
        </p>
        <Link
          to="/memberships"
          className="text-sm text-gray-900 font-semibold underline mt-4 inline-block"
        >
          ← Back to Memberships
        </Link>
      </div>
    );
  }

  const member = membership.member || {};
  const planName =
    membership.plan_name ||
    membership.plan?.plan_name ||
    membership.planName ||
    "Gym Membership";
  const memberName =
    member.name || membership.memberName || "Unknown Member";
  const memberId =
    member._id || membership.member_id || membership.memberId;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/memberships"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Memberships
          </Link>
          <span className="text-gray-300">/</span>
          <h2 className="text-xl font-bold text-gray-900">
            {planName} - {memberName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleToggleStatus}
            disabled={actionLoading}
          >
            {membership.status === "ACTIVE"
              ? "Cancel Plan"
              : "Reactivate Plan"}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Plan Overview Card */}
        <Card className="flex flex-col items-center text-center p-6 md:col-span-1">
          <div className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-2xl uppercase mb-3 shadow-sm">
            💳
          </div>
          <h3 className="text-lg font-bold text-gray-900">{planName}</h3>
          <p className="text-sm font-semibold text-emerald-600 mt-1">
            {formatCurrency(membership.amount || membership.price)}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Badge status={membership.status || "ACTIVE"} />
            <Badge status={membership.payment_status || "PAID"}>
              {membership.payment_status || "PAID"}
            </Badge>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2.5 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Member:</span>
              {memberId ? (
                <Link
                  to={`/members/${memberId}`}
                  className="font-semibold text-gray-900 hover:underline truncate max-w-[130px]"
                >
                  {memberName}
                </Link>
              ) : (
                <span className="font-semibold text-gray-800">{memberName}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment:</span>
              <span className="font-medium text-gray-800">
                {membership.payment_method || "CASH"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Valid Until:</span>
              <span className="font-medium text-gray-800">
                {formatDate(membership.end_date || membership.endDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <span className="font-mono text-[11px] text-gray-600 truncate max-w-[150px]">
                {membership._id}
              </span>
            </div>
          </div>
        </Card>

        {/* Right Column: Detailed Sections */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Member Information Card */}
          <Card title="Member Information">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Member Name</span>
                {memberId ? (
                  <Link
                    to={`/members/${memberId}`}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {memberName} →
                  </Link>
                ) : (
                  <span className="font-semibold text-gray-900">
                    {memberName}
                  </span>
                )}
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Email Address</span>
                <span className="font-medium text-gray-900">
                  {member.email || "Not recorded"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Phone Number</span>
                <span className="font-medium text-gray-900">
                  {formatPhone(member.phone)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Member ID</span>
                <span className="font-mono text-xs text-gray-600">
                  {memberId || "-"}
                </span>
              </div>
            </div>
          </Card>

          {/* Subscription & Payment Information */}
          <Card title="Subscription & Billing Details">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Plan Title</span>
                <span className="font-semibold text-gray-900">{planName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Subscription Price</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(membership.amount || membership.price)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium text-gray-900">
                  {membership.payment_method || "CASH"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Payment Status</span>
                <Badge status={membership.payment_status || "PAID"}>
                  {membership.payment_status || "PAID"}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Start Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(membership.start_date || membership.startDate)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">End / Expiry Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(membership.end_date || membership.endDate)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Plan Status</span>
                <Badge status={membership.status || "ACTIVE"} />
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Membership Record ID</span>
                <span className="font-mono text-xs text-gray-600">
                  {membership._id}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Membership Record"
        message="Are you sure you want to remove this membership record?"
        confirmText="Delete Record"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default MembershipDetailsPage;
