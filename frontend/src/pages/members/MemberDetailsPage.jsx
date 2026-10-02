import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { membersApi } from "../../api/members.api";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import { formatDate } from "../../utils/dateUtils";
import { formatPhone } from "../../utils/formatters";

export const MemberDetailsPage = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      membersApi
        .getById(id)
        .then((data) => setMember(data?.member || data))
        .catch((err) => console.error("Error loading member profile:", err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found.</p>
        <Link
          to="/members"
          className="text-sm text-gray-900 font-semibold underline mt-2 inline-block"
        >
          ← Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          to="/members"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Members
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Personal Information">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{member.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Membership Plan</span>
              <span className="font-medium text-gray-900">
                {member.membership_type}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-900">
                {formatPhone(member.phone)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Gender</span>
              <span className="font-medium text-gray-900">
                {member.gender || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Joined Date</span>
              <span className="font-medium text-gray-900">
                {formatDate(member.joinedDate)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberDetailsPage;
