import React from "react";
import { TriangleAlert } from "lucide-react";

const ConfirmationModal = ({ isOpen, title, subtitle, onCancelText, onConfirmText, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4">
            {/* Modal Card */}
            <div className="bg-white rounded-b-xl shadow-2xl w-full max-w-lg mt-20">
                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-4">
                        {/* Icon */}
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                            <TriangleAlert className="w-7 h-7 text-red-600" />
                        </div>

                        {/* Title */}
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                            {title}
                        </h2>
                    </div>

                    {/* Subtitle */}
                    <p className="text-gray-600 mb-6">
                        {subtitle}
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
                        >
                            {onCancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm shadow-sm hover:bg-red-700 transition-colors"
                        >
                            {onConfirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
