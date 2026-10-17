import React, { useEffect, useRef, useState } from "react";
import { Check, Clock3, Flag, Search, ShieldAlert, ShieldCheck, UserRound, X } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getImageUrl } from "../../api";
import { fetchListingsForReview, fetchManagedUsers, fetchUserModerationHistory, reviewListing, setUserBlocked, setUserFlag } from "../../api/admin";

function statusLabel(user) {
  if (user.status === "blocked") return "Blocked";
  return user.isFlagged ? "Flagged" : "Active";
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userLoading, setUserLoading] = useState(true);
  const [listingLoading, setListingLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [activeAction, setActiveAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const actionController = useRef(null);
  const historyController = useRef(null);
  const [historyUserId, setHistoryUserId] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const reasonInputRef = useRef(null);

  useEffect(() => () => {
    actionController.current?.abort();
    actionController.current = null;
    historyController.current?.abort();
    historyController.current = null;
  }, []);

  useEffect(() => {
    if (!pendingAction) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape" && !activeAction) setPendingAction(null);
    }
    reasonInputRef.current?.focus();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingAction, activeAction]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setUserLoading(true);
      try {
        const result = await fetchManagedUsers(
          { ...filters, page, limit: 25 },
          { signal: controller.signal },
        );
        setUsers(result.users);
        setTotalPages(Math.max(result.totalPages || 1, 1));
      } catch (requestError) {
        if (requestError.name !== "CanceledError") {
          setError(requestError?.response?.data?.message || "Couldn't load user accounts.");
        }
      } finally {
        if (!controller.signal.aborted) setUserLoading(false);
      }
    }, filters.search ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filters, page, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    setListingLoading(true);
    fetchListingsForReview({ signal: controller.signal })
      .then(setListings)
      .catch((requestError) => {
        if (requestError.name !== "CanceledError") {
          setError(requestError?.response?.data?.message || "Couldn't load listings for review.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setListingLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);

  async function performAction(key, action, successMessage) {
    actionController.current?.abort();
    const controller = new AbortController();
    actionController.current = controller;
    setActiveAction(key);
    setError("");
    setNotice("");
    try {
      await action({ signal: controller.signal });
      setNotice(successMessage);
      setPendingAction(null);
      setReason("");
      setRefresh((value) => value + 1);
    } catch (actionError) {
      if (actionError.name !== "CanceledError") {
        setError(actionError?.response?.data?.message || "That action couldn't be completed.");
      }
    } finally {
      if (actionController.current === controller) {
        actionController.current = null;
        setActiveAction("");
      }
    }
  }

  function requestFlag(user) {
    setReason("");
    setReasonError("");
    setPendingAction({ type: "flag", user, flagged: !user.isFlagged });
  }

  function requestBlock(user) {
    setReason("");
    setReasonError("");
    setPendingAction({ type: "block", user, blocked: user.status !== "blocked" });
  }

  function requestListingReview(listing, decision) {
    setReason("");
    setReasonError("");
    setPendingAction({ type: "listing", listing, decision });
  }

  function confirmPendingAction(event) {
    event.preventDefault();
    const requiresReason = pendingAction?.type === "block" && pendingAction.blocked
      || pendingAction?.type === "flag" && pendingAction.flagged
      || pendingAction?.type === "listing" && pendingAction.decision === "rejected";
    if (requiresReason && !reason.trim()) {
      setReasonError("Please provide a reason for this action.");
      return;
    }

    if (pendingAction.type === "flag") {
      const { user, flagged } = pendingAction;
      performAction(
        `${user._id}-flag`,
        (config) => setUserFlag(user._id, flagged, reason.trim(), config),
        flagged ? "Account flagged." : "Account flag cleared.",
      );
    } else if (pendingAction.type === "block") {
      const { user, blocked } = pendingAction;
      performAction(
        `${user._id}-block`,
        (config) => setUserBlocked(user._id, blocked, reason.trim(), config),
        blocked ? "Account blocked." : "Account unblocked.",
      );
    } else if (pendingAction.type === "listing") {
      const { listing, decision } = pendingAction;
      performAction(
        `${listing._id}-${decision}`,
        (config) => reviewListing(listing._id, decision, reason.trim(), config),
        decision === "approved" ? "Listing approved and published." : "Listing returned to the host.",
      );
    }
  }

  async function handleHistory(userId) {
    historyController.current?.abort();
    if (historyUserId === userId) {
      setHistoryUserId("");
      setHistory([]);
      return;
    }

    const controller = new AbortController();
    historyController.current = controller;
    setHistoryUserId(userId);
    setHistory([]);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const result = await fetchUserModerationHistory(userId, { signal: controller.signal });
      if (!controller.signal.aborted) setHistory(result);
    } catch (requestError) {
      if (requestError.name !== "CanceledError") {
        setHistoryError(requestError?.response?.data?.message || "Couldn't load moderation history.");
      }
    } finally {
      if (historyController.current === controller) {
        historyController.current = null;
        setHistoryLoading(false);
      }
    }
  }

  function updateFilter(field, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">
          <p className="staye-eyebrow">Platform administration</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">Trust &amp; safety</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
            Review new host listings and manage guest or host accounts. Restrictions and listing rejections require a reason and are recorded in the activity history.
          </p>
        </header>

        {error && <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>}
        {notice && <div role="status" className="mb-4 rounded-xl border border-brand/30 bg-brand-light px-4 py-3 text-sm text-navy-900">{notice}</div>}

        <section aria-labelledby="review-listings-heading" className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="review-listings-heading" className="text-xl font-bold text-navy-900">Listings awaiting review</h2>
              <p className="mt-1 text-sm text-ink-500">New listings stay hidden until approved.</p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-navy-900">{listings.length} pending</span>
          </div>
          {listingLoading ? <LoadingSpinner label="Loading listings for review..." /> : listings.length === 0 ? (
            <EmptyState title="No listings to review" description="New host listings will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {listings.map((listing) => (
                <article key={listing._id} className="min-w-0 rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-bold text-navy-900">{listing.title}</h3>
                      <p className="mt-1 text-sm text-ink-500">{listing.location}</p>
                      <p className="mt-2 text-xs text-ink-500">
                        Host: {listing.hostId?.name || "Unknown"}{listing.hostId?.email ? ` · ${listing.hostId.email}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Pending</span>
                  </div>
                  <p className="mt-4 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-ink-700">{listing.description}</p>
                  {!!listing.images?.length && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {listing.images.slice(0, 6).map((image, index) => (
                        <img
                          key={`${image}-${index}`}
                          src={getImageUrl(image)}
                          alt={`${listing.title} photo ${index + 1}`}
                          loading="lazy"
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-ink-500">
                    {(listing.rooms || []).map((room) => `${room.name}: ${room.price}`).join(" · ") || "No room categories"}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-300 pt-4">
                    <button
                      type="button"
                      disabled={!!activeAction}
                      onClick={() => requestListingReview(listing, "approved")}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={!!activeAction}
                      onClick={() => requestListingReview(listing, "rejected")}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-danger/30 px-4 py-2 text-sm font-semibold text-danger hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" aria-hidden="true" /> Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="accounts-heading">
          <div className="mb-4">
            <h2 id="accounts-heading" className="text-xl font-bold text-navy-900">Guest and host accounts</h2>
            <p className="mt-1 text-sm text-ink-500">Flags identify accounts needing attention; blocks prevent further authenticated access.</p>
          </div>
          <div className="mb-4 grid gap-3 rounded-2xl border border-ink-300 bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
            <label className="relative sm:col-span-2 lg:col-span-2">
              <span className="sr-only">Search accounts</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" aria-hidden="true" />
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search name or email"
                className="min-h-11 w-full rounded-xl border border-ink-300 pl-9 pr-3 text-sm outline-none focus:border-brand"
              />
            </label>
            <label>
              <span className="sr-only">Filter by role</span>
              <select value={filters.role} onChange={(event) => updateFilter("role", event.target.value)} className="min-h-11 w-full rounded-xl border border-ink-300 bg-white px-3 text-sm">
                <option value="">All roles</option>
                <option value="guest">Guests</option>
                <option value="host">Hosts</option>
                <option value="admin">Super admins</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="min-h-11 w-full rounded-xl border border-ink-300 bg-white px-3 text-sm">
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
          </div>

          {userLoading ? <LoadingSpinner label="Loading accounts..." /> : users.length === 0 ? (
            <EmptyState title="No matching accounts" description="Try changing the role, status, or search filters." />
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <article key={user._id} className="rounded-2xl border border-ink-300 bg-white p-4 shadow-card sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                        <UserRound className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-navy-900">{user.name}</h3>
                        <p className="break-all text-sm text-ink-500">{user.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium capitalize text-ink-700">{user.role || "guest"}</span>
                          <span className={`rounded-full px-2.5 py-1 font-medium ${user.status === "blocked" ? "bg-red-50 text-danger" : user.isFlagged ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}>
                            {statusLabel(user)}
                          </span>
                        </div>
                        {(user.blockReason || user.flagReason) && (
                          <p className="mt-2 break-words text-xs text-ink-500">
                            {user.status === "blocked" ? `Block reason: ${user.blockReason}` : `Flag reason: ${user.flagReason}`}
                          </p>
                        )}
                      </div>
                    </div>
                    {["guest", "host"].includes(user.role) && (
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          disabled={!!activeAction}
                          onClick={() => handleHistory(user._id)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Clock3 className="h-4 w-4" aria-hidden="true" /> {historyUserId === user._id ? "Hide history" : "History"}
                        </button>
                        <button
                          type="button"
                          disabled={!!activeAction}
                          onClick={() => requestFlag(user)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Flag className="h-4 w-4" aria-hidden="true" /> {user.isFlagged ? "Clear flag" : "Flag"}
                        </button>
                        <button
                          type="button"
                          disabled={!!activeAction}
                          onClick={() => requestBlock(user)}
                          className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50 ${user.status === "blocked" ? "border border-ink-300 text-ink-700 hover:bg-gray-50" : "bg-danger text-white hover:bg-red-700"}`}
                        >
                          {user.status === "blocked" ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <ShieldAlert className="h-4 w-4" aria-hidden="true" />}
                          {user.status === "blocked" ? "Unblock" : "Block"}
                        </button>
                      </div>
                    )}
                  </div>
                  {historyUserId === user._id && (
                    <div className="mt-4 border-t border-ink-300 pt-4">
                      <h4 className="text-sm font-semibold text-navy-900">Moderation history</h4>
                      {historyError && <p role="alert" className="mt-2 text-sm text-danger">{historyError}</p>}
                      {historyLoading ? <p className="mt-2 text-sm text-ink-500">Loading history...</p> : history.length === 0 ? (
                        <p className="mt-2 text-sm text-ink-500">No moderation actions recorded.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {history.map((entry) => (
                            <li key={entry._id} className="rounded-xl bg-gray-50 px-3 py-2 text-sm">
                              <p className="font-medium capitalize text-ink-800">{entry.action}</p>
                              <p className="mt-1 break-words text-xs text-ink-500">
                                {entry.reason || "No reason recorded"} · {entry.actorUserId?.name || "Admin"} · {new Date(entry.createdAt).toLocaleString()}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {!userLoading && totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="min-h-10 rounded-xl border border-ink-300 px-4 text-sm font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-sm text-ink-500">Page {page} of {totalPages}</p>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="min-h-10 rounded-xl border border-ink-300 px-4 text-sm font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
      {pendingAction && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-navy-950/60 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="moderation-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-popover sm:p-6"
          >
            <h2 id="moderation-dialog-title" className="text-xl font-bold text-navy-900">
              {pendingAction.type === "listing"
                ? `${pendingAction.decision === "approved" ? "Approve" : "Reject"} listing`
                : `${pendingAction.blocked === true ? "Block" : pendingAction.blocked === false ? "Unblock" : pendingAction.flagged ? "Flag" : "Clear flag"} account`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              {pendingAction.type === "listing"
                ? pendingAction.listing.title
                : `${pendingAction.user.name} · ${pendingAction.user.email}`}
            </p>
            <form className="mt-5" onSubmit={confirmPendingAction}>
              <label htmlFor="moderation-reason" className="block text-sm font-semibold text-ink-800">
                Reason
                <span className="ml-1 font-normal text-ink-500">
                  {pendingAction.type === "listing" && pendingAction.decision === "approved"
                    || pendingAction.type === "block" && !pendingAction.blocked
                    || pendingAction.type === "flag" && !pendingAction.flagged ? "(optional)" : "(required)"}
                </span>
              </label>
              <textarea
                id="moderation-reason"
                ref={reasonInputRef}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError("");
                }}
                maxLength={500}
                rows={4}
                className="mt-2 w-full resize-y rounded-xl border border-ink-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
                placeholder="Add a concise note for the account history."
              />
              <div className="mt-1 flex justify-between gap-3">
                {reasonError ? <p role="alert" className="text-xs text-danger">{reasonError}</p> : <span />}
                <span className="text-xs text-ink-500">{reason.length}/500</span>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={!!activeAction}
                  onClick={() => setPendingAction(null)}
                  className="min-h-11 rounded-xl border border-ink-300 px-4 text-sm font-semibold text-ink-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!activeAction}
                  className="min-h-11 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  {activeAction ? "Saving..." : "Confirm"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
