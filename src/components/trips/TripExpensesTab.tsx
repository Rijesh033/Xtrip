import React, { useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Receipt, Search, Trash2, X } from 'lucide-react';
import {
  CATEGORY_COLORS,
  EXPENSE_CATEGORIES,
  formatDisplayDate,
  formatMoney,
  getTodayIsoDate,
} from '../../lib/constants';
import { createExpense, deleteExpense, updateExpense } from '../../lib/db';
import type { Expense, ExpenseCategory, Trip } from '../../types/xtrip';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ImageUploadField } from '../common/ImageUploadField';
import { SmartImage } from '../common/SmartImage';

type ExpenseSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

interface TripExpensesTabProps {
  trip: Trip;
  userId: string;
  expenses: Expense[];
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function TripExpensesTab({ trip, userId, expenses, onNotify }: TripExpensesTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ExpenseCategory>('All');
  const [sortBy, setSortBy] = useState<ExpenseSort>('date_desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [receiptViewer, setReceiptViewer] = useState<Expense | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [expenseDate, setExpenseDate] = useState(getTodayIsoDate());
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const remaining = trip.budget - totalSpent;
  const pct = trip.budget > 0 ? Math.round((totalSpent / trip.budget) * 100) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = expenses.filter((e) => {
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
      if (!q) return true;
      return e.title.toLowerCase().includes(q) || e.notes.toLowerCase().includes(q);
    });
    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return a.expenseDate.localeCompare(b.expenseDate);
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        case 'date_desc':
        default:
          return b.expenseDate.localeCompare(a.expenseDate);
      }
    });
    return list;
  }, [expenses, search, categoryFilter, sortBy]);

  const openCreate = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount('');
    setCategory('Food');
    setExpenseDate(getTodayIsoDate());
    setNotes('');
    setReceiptImage('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setExpenseDate(exp.expenseDate);
    setNotes(exp.notes);
    setReceiptImage(exp.receiptImage || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter an expense title.');
      return;
    }
    const parsed = Number(amount);
    if (!amount.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!expenseDate) {
      setFormError('Please pick a date.');
      return;
    }

    setSaving(true);
    try {
      if (editingExpense) {
        await updateExpense(
          editingExpense.id,
          {
            title,
            amount: parsed,
            category,
            expenseDate,
            notes,
            receiptImage,
          },
          editingExpense.receiptImage
        );
        onNotify('success', `Updated "${title.trim()}".`);
      } else {
        await createExpense({
          tripId: trip.id,
          userId,
          title,
          amount: parsed,
          category,
          expenseDate,
          notes,
          receiptImage,
        });
        onNotify('success', `Added "${title.trim()}".`);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setDeleting(true);
    try {
      await deleteExpense(deletingExpense);
      onNotify('success', `Deleted "${deletingExpense.title}".`);
      setDeletingExpense(null);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to delete expense.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Live totals strip */}
      <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-xs text-[var(--xt-text-muted)]">Total Spent</p>
            <p className="font-mono-num text-lg font-semibold text-[var(--xt-gold)]">
              {formatMoney(totalSpent, trip.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--xt-text-muted)]">Remaining</p>
            <p
              className={`font-mono-num text-lg font-semibold ${
                remaining < 0 ? 'text-[var(--xt-danger)]' : 'text-[var(--xt-success)]'
              }`}
            >
              {formatMoney(remaining, trip.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--xt-text-muted)]">Used</p>
            <p className="font-mono-num text-lg font-semibold text-[var(--xt-text)]">
              {trip.budget > 0 ? `${pct}%` : '—'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Filters */}
      {expenses.length > 0 ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[var(--xt-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses or notes..."
              aria-label="Search expenses"
              className="w-full min-h-[42px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] pl-9 pr-3 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter expenses by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'All' | ExpenseCategory)}
              className="min-h-[42px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] px-3 text-xs font-medium text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort expenses"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ExpenseSort)}
              className="min-h-[42px] rounded-xl bg-[var(--xt-surface)] border border-[var(--xt-border)] px-3 text-xs font-medium text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
            >
              <option value="date_desc">Date: Newest</option>
              <option value="date_asc">Date: Oldest</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
            </select>
          </div>
        </div>
      ) : null}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-10 text-center space-y-3">
          <Receipt className="w-9 h-9 text-[var(--xt-gold)] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold text-[var(--xt-text)]">
              No expenses recorded
            </h3>
            <p className="text-sm text-[var(--xt-text-muted)]">
              Keep your trip budget accurate by logging stays, meals, flights, and gear.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add First Expense
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] p-8 text-center space-y-2">
          <p className="text-sm text-[var(--xt-text-muted)]">No expenses match your filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
            }}
            className="text-xs font-medium text-[var(--xt-gold)] hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] divide-y divide-[var(--xt-border)] overflow-hidden">
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--xt-surface-2)]/40 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm mt-1.5 shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}
                  aria-hidden="true"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[var(--xt-text)] truncate">
                      {exp.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--xt-text-muted)]">
                    {exp.category} · {formatDisplayDate(exp.expenseDate)}
                  </p>
                  {exp.notes ? (
                    <p className="text-xs text-[var(--xt-text-muted)]/90 line-clamp-2">{exp.notes}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-6 sm:pl-0">
                {exp.receiptImage ? (
                  <button
                    type="button"
                    onClick={() => setReceiptViewer(exp)}
                    className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--xt-border)] hover:border-[var(--xt-gold)] cursor-pointer shrink-0"
                    title="View receipt"
                  >
                    <SmartImage
                      src={exp.receiptImage}
                      alt={`Receipt for ${exp.title}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : null}

                <span className="font-mono-num text-base font-semibold text-[var(--xt-text)]">
                  {formatMoney(exp.amount, trip.currency)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(exp)}
                    aria-label={`Edit ${exp.title}`}
                    className="min-w-[38px] min-h-[38px] rounded-lg text-[var(--xt-text-muted)] hover:text-[var(--xt-gold)] hover:bg-[var(--xt-surface-2)] flex items-center justify-center cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingExpense(exp)}
                    aria-label={`Delete ${exp.title}`}
                    className="min-w-[38px] min-h-[38px] rounded-lg text-[var(--xt-text-muted)] hover:text-[var(--xt-danger)] hover:bg-[var(--xt-surface-2)] flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expense Add/Edit Modal */}
      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[var(--xt-surface)] border border-[var(--xt-border)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--xt-border)]">
              <h3 className="font-display text-xl font-semibold text-[var(--xt-text)]">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-[var(--xt-text-muted)] hover:text-[var(--xt-text)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto px-6 py-5 space-y-4">
              {formError ? (
                <div className="rounded-xl bg-[#2a1416]/90 border border-[#D96B6B]/35 px-4 py-3 text-sm text-[#F4B4B4]">
                  {formError}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="exp-title" className="block text-sm font-medium text-[var(--xt-text)]">
                  Title
                </label>
                <input
                  id="exp-title"
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mountain lodge dinner"
                  className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="exp-amount" className="block text-sm font-medium text-[var(--xt-text)]">
                    Amount ({trip.currency})
                  </label>
                  <input
                    id="exp-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="45.00"
                    className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm font-mono-num text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="exp-date" className="block text-sm font-medium text-[var(--xt-text)]">
                    Date
                  </label>
                  <input
                    id="exp-date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="exp-cat" className="block text-sm font-medium text-[var(--xt-text)]">
                  Category
                </label>
                <select
                  id="exp-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="exp-notes" className="block text-sm font-medium text-[var(--xt-text)]">
                  Notes (Optional)
                </label>
                <textarea
                  id="exp-notes"
                  rows={2}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Split bill, booking reference, or payment details..."
                  className="w-full rounded-xl bg-[var(--xt-bg)] border border-[var(--xt-border)] px-3.5 py-2 text-sm text-[var(--xt-text)] focus:outline-none focus:border-[var(--xt-gold)]"
                />
              </div>

              <ImageUploadField
                userId={userId}
                tripId={trip.id}
                value={receiptImage}
                onChange={setReceiptImage}
                label="Receipt or Photo (Optional)"
                aspectClass="h-32"
              />

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--xt-border)] text-sm font-medium text-[var(--xt-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-6 py-2 rounded-xl bg-[var(--xt-gold)] text-[#081411] font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingExpense ? 'Save Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Receipt Lightbox */}
      {receiptViewer ? (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setReceiptViewer(null)}
        >
          <div className="max-w-2xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-[#F5F3EC]">
              <div>
                <p className="font-semibold">{receiptViewer.title}</p>
                <p className="text-xs text-[#A8B3AC]">
                  {formatMoney(receiptViewer.amount, trip.currency)} · {formatDisplayDate(receiptViewer.expenseDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptViewer(null)}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-white/10 flex items-center justify-center text-[#F5F3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-[#081411] border border-white/10 max-h-[75dvh]">
              <SmartImage
                src={receiptViewer.receiptImage}
                alt={`Receipt for ${receiptViewer.title}`}
                className="w-full h-full max-h-[75dvh] object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingExpense)}
        title="Delete Expense"
        message={
          deletingExpense
            ? `Remove "${deletingExpense.title}" (${formatMoney(deletingExpense.amount, trip.currency)}) from this trip?`
            : ''
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpense(null)}
      />
    </div>
  );
}
