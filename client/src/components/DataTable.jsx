import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IoReload, IoTrashOutline } from "react-icons/io5";
import { FaEdit, FaSort, FaSortAlphaDown, FaSortAlphaUp, FaTrashAlt } from 'react-icons/fa';
import { VscSettings } from "react-icons/vsc";
import { MdOutlineClose } from "react-icons/md";

const useOutsideAlerter = (ref, callback) => {
    useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref, callback]);
};

const DataTable = ({
    title,
    data,
    uniqueIdKey,
    loading,
    onReload,
    columns,
    setColumns,
    pagination,
    setPagination,
    // onRowClick,
    onDeleteSelected,
    headerActions,
    onEditRow,
    onDeleteRow
}) => {

    console.log("Data")
    const [selectedItems, setSelectedItems] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
    const columnDropdownRef = useRef(null);

    // ======== Filtering (basic placeholder, extend as needed) ========
    const filteredItems = useMemo(() => {
        return data; // no filters yet
    }, [data]);

    // ======== Sorting ========
    const sortedItems = useMemo(() => {
        const sortableItems = [...filteredItems];
        if (sortConfig?.key) {
            sortableItems.sort((a, b) => {
                const itemA = getNestedValue(a, sortConfig.key) || '';
                const itemB = getNestedValue(b, sortConfig.key) || '';

                // Basic type-aware comparison (can be extended)
                if (typeof itemA === 'string' && typeof itemB === 'string') {
                    return sortConfig.direction === 'asc' ? itemA.localeCompare(itemB) : itemB.localeCompare(itemA);
                }
                if (itemA < itemB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (itemA > itemB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredItems, sortConfig]);

    const isAllSelected = useMemo(() => {
        if (filteredItems.length === 0) return false;
        return Object.keys(selectedItems).length === filteredItems.length;
    }, [filteredItems, selectedItems]);

    // ======== Handlers ========
    const handleSortClick = (field) => {
        setSortConfig(prev => ({
            key: field,
            direction: prev.key === field && prev.direction === "asc" ? "desc" : "asc"
        }));
    };

    const handleHeaderCheckboxChange = () => {
        if (isAllSelected) {
            setSelectedItems({});
        } else {
            const allItemIds = filteredItems.reduce((acc, item) => {
                acc[item[uniqueIdKey]] = true;
                return acc;
            }, {});
            setSelectedItems(allItemIds);
        }
    };

    const handleItemCheckboxChange = (itemId) => {
        setSelectedItems(prev => {
            const newSelected = { ...prev };
            if (newSelected[itemId]) delete newSelected[itemId];
            else newSelected[itemId] = true;
            return newSelected;
        });
    };

    const handleMouseDown = (e, field) => {
        e.preventDefault();
        const startX = e.pageX;

        const col = columns.find((c) => c.field === field);
        if (!col) return; // Guard in case column is not found
        const startWidth = col.width || 150; // Use a default if width isn't set

        const onMouseMove = (moveEvent) => {
            const delta = moveEvent.pageX - startX;
            const newWidth = Math.max(50, startWidth + delta);

            setColumns((prev) =>
                prev.map((c) =>
                    c.field === field ? { ...c, width: newWidth } : c
                )
            );
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    useOutsideAlerter(columnDropdownRef, () => setColumnDropdownOpen(false));

    // clear selection when data changes
    useEffect(() => {
        setSelectedItems({});
    }, [data]);

    return (
        <>
            <div className="p-4 mb-4 bg-gray-50 border border-gray-200/80 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h1>
                    <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onReload}>
                        <IoReload size={22} className={`text-gray-500 cursor-pointer hover:text-gray-800 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} title="Reload" />
                    </button>
                    <button onClick={() => setColumnDropdownOpen(o => !o)} className="rounded-md text-gray-500 hover:text-gray-800" title="Show/hide columns">
                        <VscSettings size={26} />
                    </button>
                    {Object.keys(selectedItems).length > 0 && (
                        <button onClick={() => onDeleteSelected(Object.keys(selectedItems))} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600  transition-colors rounded-md">
                            <IoTrashOutline /> Delete ({Object.keys(selectedItems).length})
                        </button>
                    )}
                    {headerActions}
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden ">
                <div className="flex-grow flex flex-col rounded-b-md shadow-md bg-gray-50 overflow-hidden min-w-0 transition-all duration-300 h-screen">
                    <div className="flex-grow w-full overflow-auto">
                        <table className="w-full table-fixed border-collapse">
                            {!loading && data.length > 0 && (
                                <thead className="sticky top-0 bg-gray-50 z-10">
                                    <tr className="border-b border-gray-200 text-gray-600">
                                        <th className="px-4 py-2 w-12 sticky left-0 bg-gray-50 z-20">
                                            <input type="checkbox" checked={isAllSelected} onChange={handleHeaderCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        </th>
                                        {columns.filter(c => c.visible).map(column => (
                                            <th key={column.field} style={{ width: `${column.width || 150}px` }} className="relative px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider group">
                                                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => handleSortClick(column.field)}>
                                                    <span className="truncate">{column.label}</span>
                                                    <span className="ml-2">
                                                        {sortConfig?.key === column.field ? ( // Changed to column.field
                                                            sortConfig.direction === "asc" ? <FaSortAlphaUp className="text-blue-600" /> : <FaSortAlphaDown className="text-blue-600" />
                                                        ) : (
                                                            <FaSort className="text-gray-400 group-hover:text-gray-600" />
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="absolute top-0 right-0 w-px h-full cursor-col-resize bg-slate-300 hover:bg-blue-300" onMouseDown={(e) => handleMouseDown(e, column.field)} />
                                            </th>
                                        ))}

                                        <th className="w-[150px] px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                            )}
                            <tbody>
                                {loading === false && sortedItems.map(item => (
                                    <tr
                                        key={item[uniqueIdKey]}
                                        className="group hover:bg-white border-b border-gray-200 cursor-pointer"
                                    // onClick={(e) => onRowClick(e, item)}
                                    >
                                        <td
                                            className="w-12 px-4 py-2 sticky left-0 group-hover:bg-white bg-gray-50 z-10 cursor-default"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={!!selectedItems[item[uniqueIdKey]]}
                                                onChange={() => handleItemCheckboxChange(item[uniqueIdKey])}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>

                                        {columns.filter(c => c.visible).map(column => (
                                            <td key={column.field} className="px-4 py-2 border text-sm text-gray-700 truncate">
                                                {renderCellContent(column, item)} {/* Pass column object */}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 border text-sm text-gray-700 truncate">
                                            <div className='flex items-center gap-5'>
                                                <FaEdit
                                                    className='text-blue-500 cursor-pointer hover:text-blue-700'
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent row click
                                                        onEditRow && onEditRow(item);
                                                    }}
                                                    title="Edit"
                                                />
                                                <FaTrashAlt
                                                    className='text-red-500 cursor-pointer hover:text-red-700'
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent row click
                                                        if (window.confirm(`Are you sure you want to delete this item?`)) {
                                                            onDeleteRow && onDeleteRow(item[uniqueIdKey]);
                                                        }
                                                    }}
                                                    title="Delete"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                        {loading && <div className="text-center py-10 text-gray-500">Loading records...</div>}
                        {!loading && data.length === 0 && <div className="text-center py-10 text-gray-500">No records found.</div>}
                    </div>
                    <div className="flex-shrink-0 border-t border-gray-200">
                        {/* <Pagination ... /> */}
                    </div>
                </div>
            </div>

            {/* columns visibility modal */}
            {columnDropdownOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 bg-opacity-50 backdrop-blur-sm" onClick={() => setColumnDropdownOpen(false)}>
                    <div ref={columnDropdownRef} className="bg-white rounded-md w-full max-w-md transform transition-all flex flex-col" onClick={(e) => e.stopPropagation()}> {/* Added stopPropagation */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Customize Visible Columns</h3>
                            <button onClick={() => setColumnDropdownOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                                <MdOutlineClose size={22} />
                            </button>
                        </div>
                        <div className="px-6 space-y-1 max-h-[60vh] overflow-y-auto">
                            {columns.map(c => (
                                <div key={c.field} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-gray-100 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={c.visible}
                                        onChange={() => setColumns(p => p.map(pc => pc.field === c.field ? { ...pc, visible: !pc.visible } : pc))}
                                        className="size-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="text-md text-gray-700 select-none">{c.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                            <button onClick={() => setColumnDropdownOpen(false)} className="px-6 py-1 bg-blue-600 text-white text-md rounded-md hover:bg-blue-700">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DataTable;

const getNestedValue = (obj, path) => {
    if (!path || typeof path !== "string" || !obj) return ""; // guard for null/undefined obj
    return path
        .replace(/\[(\w+)\]/g, ".$1") // convert [0] → .0
        .split(".")
        .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ""), obj);
};

// Modified renderCellContent to accept column object and handle render function
const renderCellContent = (column, row) => {
    // If a custom render function is provided for the column, use it
    if (column.render && typeof column.render === 'function') {
        return column.render(row);
    }

    const actualValue = getNestedValue(row, column.field);

    if (typeof actualValue === "boolean") {
        return (
            <span
                className={`px-2 py-1 text-xs rounded ${actualValue
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
            >
                {actualValue ? "Yes" : "No"}
            </span>
        );
    }
    // Handle Dates
    if (column.field.toLowerCase().includes('date') && actualValue instanceof Date) {
        return actualValue.toLocaleString(); // Or format as desired
    }
    // Handle objects/arrays (default display)
    if (typeof actualValue === 'object' && actualValue !== null) {
        if (Array.isArray(actualValue)) {
            return `[${actualValue.length} items]`; // Or actualValue.map(item => item.name).join(', ')
        }
        // For plain objects, you might want to display a specific property
        // E.g., if column.field is "creatorId", you might want to show "creatorId.username"
        // This is where a custom render function for `creatorId` column would be very useful.
        return JSON.stringify(actualValue); // Default: show JSON for object
    }

    return actualValue;
};