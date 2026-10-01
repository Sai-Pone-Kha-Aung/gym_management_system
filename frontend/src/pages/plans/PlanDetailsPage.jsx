import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { membershipPlansApi } from "../../api/membershipPlans.api";
import { membershipsApi } from "../../api/memberships.api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import PlansConfigModal from "../memberships/components/PlansConfigModal";
import { formatDate } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/formatters";
import {
  Sparkles,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
} from "lucide-react";

export const PlanDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [enrolledMemberships, setEnrolledMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlanData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [planRes, membershipsRes] = await Promise.all([
        membershipPlansApi.getById(id).catch(() => null),
        membershipsApi.getAll({ planId: id, size: 50 }).catch(() => ({})),
      ]);

      const planData = planRes?.membership_plan || planRes?.plan || planRes;
      setPlan(planData);

      const mList = Array.isArray(membershipsRes)
        ? membershipsRes
        : membershipsRes?.memberships || [];
      setEnrolledMemberships(mList);
    } catch (err) {
      console.error("Error loading plan details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  const handleUpdate = async (formData) => {
    setActionLoading(true);
    try {
      await membershipPlansApi.update(id, formData);
      setIsEditOpen(false);
      fetchPlanData();
    } catch (err) {
      alert(err.message || "Failed to update plan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!plan) return;
    const newStatus = plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(true);
    try {
      await membershipPlansApi.update(id, { status: newStatus });
      fetchPlanData();
    } catch (err) {
      alert(err.message || "Failed to update plan status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await membershipPlansApi.delete(id);
      setIsDeleteOpen(false);
      navigate("/membership-plans");
    } catch (err) {
      alert(err.message || "Failed to delete plan");
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

  if (!plan) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-800">
          Plan Tier Not Found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          The requested membership plan could not be found or has been removed.
        </p>
        <Link
          to="/membership-plans"
          className="text-sm text-gray-900 font-semibold underline mt-4 inline-block"
        >
          ← Back to Membership Plans
        </Link>
      </div>
    );
  }

  const durationDays = Number(plan.duration_in_days) || 30;
  const approxMonths = Math.round((durationDays / 30) * 10) / 10;
  const monthlyEquivalent =
    durationDays > 0 ? (plan.price / durationDays) * 30 : plan.price;

  // Split description perks if comma-separated or multi-sentence
  const perks = plan.description
    ? plan.description
        .split(/[,;\n•]+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : ["Full gym floor access", "Locker room & showers", "Equipment orientation"];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/membership-plans"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Membership Plans</span>
          </Link>
          <span className="text-gray-300">/</span>
          <h2 className="text-xl font-bold text-gray-900 truncate">
            {plan.plan_name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleToggleStatus}
            disabled={actionLoading}
          >
            {plan.status === "ACTIVE" ? "Deactivate Tier" : "Activate Tier"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Tier
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
        {/* Left Column: Plan Summary Card */}
        <Card className="flex flex-col items-center text-center p-6 md:col-span-1">
          <div className="w-20 h-20 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold text-2xl mb-4 shadow-sm">
            <Sparkles size={32} />
          </div>

          <h3 className="text-xl font-bold text-gray-900">{plan.plan_name}</h3>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {formatCurrency(plan.price)}
          </p>
          <span className="text-xs text-gray-400 font-medium mt-0.5">
            billed every {durationDays} days
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Badge status={plan.status || "ACTIVE"} />
            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
              {approxMonths >= 1
                ? `${approxMonths} Month${approxMonths > 1 ? "s" : ""}`
                : `${durationDays} Days`}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="w-full mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3 text-xs text-left">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Users size={14} /> Active Subscribers
              </span>
              <span className="font-semibold text-gray-900">
                {enrolledMemberships.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5">
                <DollarSign size={14} /> Equiv. Monthly Rate
              </span>
              <span className="font-medium text-gray-800">
                {formatCurrency(monthlyEquivalent)}/mo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Clock size={14} /> Duration
              </span>
              <span className="font-medium text-gray-800">
                {durationDays} Days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Calendar size={14} /> Created
              </span>
              <span className="font-medium text-gray-800">
                {formatDate(plan.createdAt)}
              </span>
            </div>
          </div>
        </Card>

        {/* Right Columns: Plan Details & Enrolled Members */}
        <div className="flex flex-col gap-6 md:col-span-2">
          {/* Plan Perks & Details */}
          <Card title="Plan Features & Member Perks">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600">
                {plan.description ||
                  "Standard full-featured membership package providing regular access to gym equipment and amenities."}
              </p>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Included Benefits
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {perks.map((perk, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-800"
                    >
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block">Tier Status</span>
                  <span className="font-semibold text-gray-900">
                    {plan.status || "ACTIVE"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Last Modified</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(plan.updatedAt || plan.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Database Record ID</span>
                  <span className="font-mono text-[11px] text-gray-500 truncate block">
                    {plan._id}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Enrolled Subscribers */}
          <Card
            title={`Enrolled Subscriptions (${enrolledMemberships.length})`}
            className="flex flex-col"
          >
            {enrolledMemberships.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No active members are currently assigned to this tier.
                <div className="mt-3">
                  <Link to="/memberships">
                    <Button size="sm" variant="secondary">
                      + Assign to a Member
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {enrolledMemberships.map((m) => {
                  const member = m.member || m.memberId || {};
                  const name = member.name || m.memberName || "Member";
                  const memberId = member._id || m.member_id || m.memberId;

                  return (
                    <div
                      key={m._id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {name ? name.slice(0, 2) : "MB"}
                        </div>
                        <div>
                          {memberId ? (
                            <Link
                              to={`/members/${memberId}`}
                              className="font-semibold text-sm text-gray-900 hover:underline block"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-sm text-gray-900 block">
                              {name}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            Valid until {formatDate(m.end_date || m.endDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge status={m.status || "ACTIVE"} />
                        <Link to={`/memberships/${m._id}`}>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Plan Modal */}
      <PlansConfigModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={plan}
        loading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Membership Plan Tier"
        message={`Are you sure you want to remove plan tier "${plan.plan_name}"? Existing active memberships might be affected.`}
        confirmText="Delete Plan Tier"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  );
};

export default PlanDetailsPage;
