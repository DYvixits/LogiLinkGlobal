// Central parcel-status metadata (kept in sync with backend server.py)
export const STATUS_FLOW = [
  "CREATED", "REGISTERED", "RECEIVED_AT_DEPOT", "CONTROLLED", "WEIGHED",
  "PACKED", "INVOICED", "PAID", "LOADED", "IN_TRANSIT", "IN_CUSTOMS",
  "ARRIVED", "AVAILABLE", "DELIVERED",
];
export const EXCEPTION_STATUSES = ["CANCELLED", "LOST", "DAMAGED"];
export const ALL_STATUSES = [...STATUS_FLOW, ...EXCEPTION_STATUSES];

// Badge classes: bg / text / border
export const STATUS_BADGE = {
  CREATED: "bg-slate-100 text-slate-600 border-slate-200",
  REGISTERED: "bg-slate-100 text-slate-700 border-slate-200",
  RECEIVED_AT_DEPOT: "bg-sky-50 text-sky-700 border-sky-200",
  CONTROLLED: "bg-sky-50 text-sky-700 border-sky-200",
  WEIGHED: "bg-sky-50 text-sky-700 border-sky-200",
  PACKED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  INVOICED: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-amber-50 text-amber-800 border-amber-200",
  LOADED: "bg-orange-50 text-orange-700 border-orange-200",
  IN_TRANSIT: "bg-orange-100 text-orange-800 border-orange-200",
  IN_CUSTOMS: "bg-orange-50 text-orange-700 border-orange-200",
  ARRIVED: "bg-teal-50 text-teal-700 border-teal-200",
  AVAILABLE: "bg-teal-50 text-teal-700 border-teal-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  LOST: "bg-red-100 text-red-800 border-red-200",
  DAMAGED: "bg-red-100 text-red-800 border-red-200",
};

export const STATUS_DOT = {
  DELIVERED: "bg-green-500",
  ARRIVED: "bg-teal-500",
  AVAILABLE: "bg-teal-500",
  IN_TRANSIT: "bg-orange-500",
  LOADED: "bg-orange-500",
  IN_CUSTOMS: "bg-orange-500",
  CANCELLED: "bg-red-500",
  LOST: "bg-red-500",
  DAMAGED: "bg-red-500",
};

export const statusDotColor = (status) => STATUS_DOT[status] || "bg-slate-400";
export const isException = (status) => EXCEPTION_STATUSES.includes(status);
export const statusIndex = (status) => STATUS_FLOW.indexOf(status);
