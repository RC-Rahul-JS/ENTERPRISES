import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  TrendingUp, Search, Loader, CalendarCheck, RefreshCw,
  CheckCircle, XCircle, Hash, BadgeIndianRupee, FileText,
  ListOrdered, Layers, ChevronRight,
} from 'lucide-react';
import { useLoader } from '../../context/LoaderContext';
import loanService from '../../api/loanService';

// ── Toast ────────────────────────────────────────────────────────────────────
const toast = {
  success: (msg) =>
    Swal.fire({ icon: 'success', title: 'Success', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }),
  error: (msg) =>
    Swal.fire({ icon: 'error', title: 'Error', text: msg, toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true }),
};

const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white w-full";
const Field = ({ label, children, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Single Posting Tab
// ─────────────────────────────────────────────────────────────────────────────
const SinglePosting = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const [loanNumber, setLoanNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handlePost = async () => {
    if (!loanNumber.trim()) return toast.error('Loan number is required');

    const confirm = await Swal.fire({
      title: 'Post Interest?',
      text: `Post interest for loan ${loanNumber}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Post',
      confirmButtonColor: '#4f46e5',
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    showLoader();
    try {
      const data = await loanService.postInterest({ loan_number: loanNumber.trim(), created_by: 'admin' });
      if (data.success === false) throw new Error(data.message);
      setResult(data);
      toast.success('Interest posted successfully!');
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to post interest');
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handleReset = () => { setLoanNumber(''); setResult(null); };

  return (
    <div className="space-y-5">
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-700">Interest Posted</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              ['Loan Number', result.loan_number],
              ['Principal',   `₹${(result.principal||0).toLocaleString()}`],
              ['Interest Posted', `₹${(result.interest_posted||0).toLocaleString()}`],
              ['Voucher No.', result.voucher_number],
              ['Next Interest Date', result.next_interest_date],
            ].map(([k, v]) => (
              <div key={k} className="bg-white rounded-lg p-3 border border-emerald-100">
                <p className="text-xs text-gray-500">{k}</p>
                <p className="font-semibold text-gray-800">{v ?? '—'}</p>
              </div>
            ))}
          </div>
          <button onClick={handleReset} className="mt-3 text-sm text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Post another
          </button>
        </div>
      )}

      {!result && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Post Interest for a Loan</h3>
          <div className="flex gap-2">
            <input
              id="interest-single-loan-number"
              className={inputCls}
              placeholder="Enter loan number..."
              value={loanNumber}
              onChange={e => setLoanNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePost()}
            />
            <button
              id="interest-single-submit"
              onClick={handlePost}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Post Interest
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Interest will be calculated based on the loan's outstanding principal, rate, and frequency.</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Batch Posting Tab
// ─────────────────────────────────────────────────────────────────────────────
const BatchPosting = () => {
  const loaderCtx = useLoader();
  const showLoader = loaderCtx?.showLoader || (() => {});
  const hideLoader = loaderCtx?.hideLoader || (() => {});

  const today = new Date().toISOString().split('T')[0];
  const [postingDate, setPostingDate] = useState(today);
  const [previewing, setPreviewing]   = useState(false);
  const [previewList, setPreviewList] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  const handlePreview = async () => {
    if (!postingDate) return toast.error('Select a date');
    setPreviewing(true);
    setPreviewList(null);
    try {
      const data = await loanService.getInterestPostingList(postingDate);
      if (data.success === false) throw new Error(data.message);
      setPreviewList(data);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to load list');
    } finally {
      setPreviewing(false);
    }
  };

  const handleBatch = async () => {
    if (!postingDate) return toast.error('Select a date');
    const confirm = await Swal.fire({
      title: 'Run Batch Interest Posting?',
      html: `Post interest for <b>${previewList?.total_loans ?? 'all'}</b> loan(s) due on <b>${postingDate}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Run Batch',
      confirmButtonColor: '#4f46e5',
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    showLoader();
    try {
      const data = await loanService.postInterestBatch({ posting_date: postingDate, created_by: 'admin' });
      if (data.success === false) throw new Error(data.message);
      setBatchResult(data);
      setPreviewList(null);
      toast.success(`Processed ${data.total_processed} loan(s)`);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Batch posting failed');
    } finally {
      setSubmitting(false);
      hideLoader();
    }
  };

  const handleReset = () => { setPostingDate(today); setPreviewList(null); setBatchResult(null); };

  return (
    <div className="space-y-5">
      {/* Date picker + buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Batch Interest Posting</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Field label="Post Interest Up To Date" required>
              <input
                id="batch-posting-date"
                type="date"
                className={inputCls}
                value={postingDate}
                onChange={e => { setPostingDate(e.target.value); setPreviewList(null); setBatchResult(null); }}
              />
              <p className="text-xs text-amber-600 mt-1">⚡ All DISBURSED loans with interest due on or before this date will appear (including new loans with no posting yet).</p>
            </Field>
          </div>
          <button
            id="batch-preview-btn"
            onClick={handlePreview}
            disabled={previewing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {previewing ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Preview Loans
          </button>
          {previewList && previewList.total_loans > 0 && (
            <button
              id="batch-run-btn"
              onClick={handleBatch}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              Run Batch
            </button>
          )}
        </div>
      </div>

      {/* Preview List */}
      {previewList && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              Loans Due for Interest on <span className="text-indigo-600">{postingDate}</span>
            </h3>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {previewList.total_loans} loan(s)
            </span>
          </div>
          {previewList.total_loans === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No loans due for interest on this date.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    {['Loan Number','Outstanding Principal','Rate','Frequency','Interest Outstanding'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewList.data.map((l, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-indigo-700">{l.loan_number}</td>
                      <td className="px-4 py-3">₹{(l.outstanding_principal||0).toLocaleString()}</td>
                      <td className="px-4 py-3">{l.interest_rate}%</td>
                      <td className="px-4 py-3 capitalize">{l.frequency}</td>
                      <td className="px-4 py-3">₹{(l.interest_outstanding||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Batch Result */}
      {batchResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-700">Batch Posting Complete</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-xs text-gray-500">Loans Processed</p>
              <p className="font-bold text-lg text-indigo-700">{batchResult.total_processed}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-xs text-gray-500">Total Interest Posted</p>
              <p className="font-bold text-lg text-emerald-700">₹{(batchResult.total_interest_posted||0).toLocaleString()}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  {['Loan Number','Interest','Voucher','Next Date','Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {batchResult.data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-indigo-700">{row.loan_number}</td>
                    <td className="px-3 py-2">{row.interest != null ? `₹${row.interest.toLocaleString()}` : '—'}</td>
                    <td className="px-3 py-2">{row.voucher_number ?? '—'}</td>
                    <td className="px-3 py-2">{row.next_interest_date ?? '—'}</td>
                    <td className="px-3 py-2">
                      {row.success === false
                        ? <span className="text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" />{row.message}</span>
                        : <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleReset} className="mt-3 text-sm text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Run another batch
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'single', label: 'Single Loan',  icon: ChevronRight },
  { key: 'batch',  label: 'Batch Posting', icon: Layers },
];

const InterestPosting = () => {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="w-7 h-7" />
          <h1 className="text-2xl font-bold">Interest Posting</h1>
        </div>
        <p className="text-indigo-100 text-sm">Post interest for individual loans or run a batch for all loans due on a date</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-200 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`interest-tab-${key}`}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'single' ? <SinglePosting /> : <BatchPosting />}
    </div>
  );
};

export default InterestPosting;
