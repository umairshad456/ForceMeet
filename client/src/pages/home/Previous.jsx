import React, { useEffect, useState } from "react";
import DataTable from "../../components/DataTable"; // Adjust path as necessary
import useAuthStore from '../../store/useAuthStore'; // Adjust path as necessary
import axiosInstance from "../../apis/axiosInstance"; // Adjust path as necessary

const Previous = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [videoModal, setVideoModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
  });

  const { isAuthenticated, token } = useAuthStore();

  const fetchPreviousMeetings = async () => {
    try {
      setLoading(true);
      // Ensure your API endpoint returns data that matches the structure you expect
      const response = await axiosInstance.get('/api/meetings/getAllPreviousMeetings');
      console.log("Fetched data:", response.data); // Log to verify data structure
      if (response.data) {
        // Assuming response.data is an array of meeting objects
        setData(response.data);
        setPagination((p) => ({ ...p, total: response.data.length }));
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching previous meetings:", err);
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    fetchPreviousMeetings();
  }, [isAuthenticated, token]);


  const keysToExclude = ["__v", "callId", "_id", "participants", "creatorId"];

  useEffect(() => {
    if (data.length > 0 && columns.length === 0) {
      const firstItem = data[0];

      // Define default columns you want to always include or explicitly control
      const initialColumns = [
        { field: "title", label: "Title", visible: true, width: 200, sortable: true },
        { field: "meetingType", label: "Meeting Type", visible: true, width: 150, sortable: true },
        { field: "meetingStatus", label: "Status", visible: true, width: 120, sortable: true },
        // Handling nested objects:
        { field: "creatorId.username", label: "Creator", visible: true, width: 180, sortable: true },
        { field: "creatorId.email", label: "Creator Email", visible: true, width: 200, sortable: true },
        {
          field: "date",
          label: "Date",
          visible: true,
          width: 200,
          sortable: true,
          render: (row) => new Date(row.date).toLocaleString('en-GB'), // Custom render for date
        },
        {
          field: "participants",
          label: "Participants",
          visible: false,
          width: 150,
          sortable: false, // Not easily sortable by default
          render: (row) => `${row.participants ? row.participants.length : 0} participant(s)`,
        },
        { field: "meetingLink", label: "Meeting Link", visible: true, width: 300, sortable: false },
      ];

      const dynamicColumns = Object.keys(firstItem)
        .filter(key =>
          !keysToExclude.includes(key) &&
          !initialColumns.some(col => col.field === key) && // Avoid duplicates
          typeof firstItem[key] !== 'object' // Only include simple types
        )
        .map(key => ({
          field: key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          visible: true,
          width: 150, // Default width
          sortable: true
        }));

      setColumns([...initialColumns, ...dynamicColumns]);
    }
  }, [data, columns.length]);

  const onDeleteSelected = (ids) => {
    setData((prev) => prev.filter((item) => !ids.includes(item._id)));
    console.log("Deleting items with IDs:", ids);
  };

  const handleEditSave = (updatedItem) => {
    setData((prev) =>
      prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
    );
    // TODO: Add actual API call to update the item
    console.log("Saving updated item:", updatedItem);
    setEditModal(null);
  };


  // New handler for single row delete
  const handleDeleteSingleRow = (id) => {
    setData((prev) => prev.filter((item) => item._id !== id));
    console.log("Deleting single item with ID:", id);
  };

  const handleEditSingleRow = (item) => {
    setEditModal(item);
  };


  return (
    <>
      <div className="mx-auto max-w-7xl">
        <DataTable
          title="Previous Meetings"
          data={data}
          uniqueIdKey="_id"
          loading={loading}
          onReload={fetchPreviousMeetings}
          columns={columns}
          setColumns={setColumns}
          pagination={pagination}
          setPagination={setPagination}
          onDeleteSelected={onDeleteSelected}
          // onRowClick={(e, item) => {
          //   if (e.target.tagName !== 'BUTTON') {
          //       setVideoModal(item);
          //   }
          // }}
          onEditRow={handleEditSingleRow}
          onDeleteRow={handleDeleteSingleRow}
        />
      </div>

      <VideoModal open={!!videoModal} onClose={() => setVideoModal(null)} src={videoModal?.video} title={videoModal?.title} /> {/* Changed to videoModal?.title */}
      <EditModal open={!!editModal} item={editModal} onClose={() => setEditModal(null)} onSave={handleEditSave} />
    </>
  );
};




// ---------------- Video Modal ----------------
function VideoModal({ open, onClose, src, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-3xl rounded-xl overflow-hidden bg-black shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white">
          <h3 className="text-sm font-medium truncate">{title || "Meeting recording"}</h3>
          <button onClick={onClose} className="rounded px-2 py-1 bg-white/10 hover:bg-white/20">✕</button>
        </div>
        {/* Your data doesn't seem to have a 'video' field directly. 
            If your `videoModal?.video` should be `meetingLink`, adjust here.
            For now, I'll use a placeholder if src is missing.
        */}
        {src ? (
          <video src={src} controls autoPlay className="w-full h-[60vh] bg-black" />
        ) : (
          <div className="w-full h-[60vh] bg-black flex items-center justify-center text-white/50">
            No video source available for this meeting.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Edit Modal ----------------
function EditModal({ open, item, onClose, onSave }) {
  const [form, setForm] = useState(item || null);

  useEffect(() => setForm(item || null), [item, open]);

  if (!open || !form) return null;

  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[85vh] overflow-y-auto transform scale-95 opacity-0 animate-fadeInUp divide-y divide-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white">
          <h3 className="font-semibold text-lg">Edit Record</h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Example of fields to edit. Adjust based on what's editable. */}
            <label className="text-sm font-medium">
              Title
              <input
                className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.title || ''} // Use 'title' from your data, provide default empty string
                onChange={(e) => change("title", e.target.value)}
              />
            </label>
            <label className="text-sm font-medium">
              Meeting Type
              <input
                className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.meetingType || ''}
                onChange={(e) => change("meetingType", e.target.value)}
              />
            </label>
            <label className="text-sm font-medium">
              Meeting Status
              <input
                className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.meetingStatus || ''}
                onChange={(e) => change("meetingStatus", e.target.value)}
              />
            </label>
            <label className="text-sm font-medium">
              Creator Username
              <input
                className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.creatorId?.username || ''} // Handle nested property
                onChange={(e) => change("creatorId", { ...form.creatorId, username: e.target.value })}
              
              />
            </label>
            <label className="text-sm font-medium">
              Date (ISO format for input type="datetime-local")
              <input
                type="datetime-local" // Use datetime-local for dates
                className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                // Ensure the date is in a format compatible with datetime-local input (YYYY-MM-DDTHH:mm)
                value={form.date ? new Date(form.date).toISOString().slice(0, 16) : ''}
                onChange={(e) => change("date", e.target.value)}
              />
            </label>
            {/* Add more editable fields based on your data structure */}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="border rounded px-4 py-2 bg-white hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="rounded px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default Previous;