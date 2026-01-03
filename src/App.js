import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  runTransaction,
  writeBatch,
  getDoc,
  setDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  User,
  Shield,
  LayoutGrid,
  Users,
  LogOut,
  CheckCircle,
  AlertCircle,
  Trash2,
  Search,
  Printer,
  MapPin,
  Edit,
  Wand2,
  X,
  FileOutput,
  Loader2,
  FileSpreadsheet,
  TrendingUp,
  UserCheck,
  Armchair,
  ShieldAlert,
  DoorOpen,
  Sparkles,
  Copy,
  Clock,
  Monitor,
  ImageDown,
  Settings,
  Plus,
  Save,
  MessageSquare,
  UserPlus,
  GripVertical,
  Link,
} from "lucide-react";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCzcB3B9CqNg1XveEKVFiadfLJJrpHxdt0",
  authDomain: "seat-ccc17.firebaseapp.com",
  projectId: "seat-ccc17",
  storageBucket: "seat-ccc17.firebasestorage.app",
  messagingSenderId: "839982988800",
  appId: "1:839982988800:web:47ad590865ae4f518ce2e5",
  measurementId: "G-F7PP8BWGX4",
};

// Initialize Firebase
const app =
  Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- Default Constants ---
const DEFAULT_CLASS_TYPES = [
  "(1) 國中初階班日",
  "(2) 國中中階班五",
  "(3) 國中中階班日",
  "(4) 國九衝刺班六",
  "(5) 國九衝刺班日",
  "(6) 高中古文十五班日",
  "(7) 高中古文十五班一",
  "(8) 高中模考班六",
  "(9) 高中作文班六",
  "(10) 高中作文班日",
  "(11) 寒訓",
  "(12) 國中暑期密集",
  "(13) 國中暑期先修",
  "(14) 國中作文三",
  "(15) 國中作文六",
];
const DEFAULT_SEMESTERS = ["上學期", "下學期"];
const DEFAULT_YEARS = ["114", "115", "116", "117"];

// Default Classroom Bindings (Initial Setup)
const DEFAULT_CLASSROOM_BINDINGS = {
  "(1) 國中初階班日": "B",
  "(2) 國中中階班五": "B",
  "(3) 國中中階班日": "B",
  "(4) 國九衝刺班六": "A",
  "(5) 國九衝刺班日": "A",
  "(6) 高中古文十五班日": "A",
  "(7) 高中古文十五班一": "A",
  "(8) 高中模考班六": "A",
  "(9) 高中作文班六": "A",
  "(10) 高中作文班日": "A",
  "(14) 國中作文三": "B",
  "(15) 國中作文六": "B",
};

const generateStandardSeats = (rows, cols, prefix) => {
  const seats = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      seats.push({ id: `${prefix}-${r}-${c}`, label: `${prefix}${r}-${c}` });
    }
  }
  return seats;
};

// --- Classroom Layout Config ---
const CLASSROOMS = {
  A: {
    name: "教室 A",
    seats: generateStandardSeats(5, 8, "A"),
    rows: 5,
    cols: 8,
    layout: { podium: "top-right", door: "top-left" },
  },
  B: {
    name: "教室 B",
    seats: generateStandardSeats(4, 6, "B"),
    rows: 4,
    cols: 6,
    layout: { podium: "top-left", door: "bottom-left" },
  },
};

// --- Helpers ---
const getLockId = (year, semester, classType, classroom, seatId) => {
  if (!seatId) return null;
  const safeClassType = classType.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "");
  return `${year}_${semester}_${safeClassType}_${classroom}_${seatId}`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "處理中...";
  if (timestamp.seconds) {
    try {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString("zh-TW", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "-";
    }
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }
  return "-";
};

// --- Sub-Components ---
const SettingsView = ({ currentConfig, onSave, onCancel }) => {
  const [localConfig, setLocalConfig] = useState(currentConfig);
  const [newItem, setNewItem] = useState("");

  const handleAddItem = (field) => {
    if (newItem.trim()) {
      setLocalConfig((prev) => ({
        ...prev,
        [field]: [...prev[field], newItem.trim()],
      }));
      setNewItem("");
    }
  };

  const handleRemoveItem = (field, index) => {
    const newList = [...localConfig[field]];
    newList.splice(index, 1);
    setLocalConfig((prev) => ({ ...prev, [field]: newList }));
  };

  const handleBindingChange = (className, room) => {
    setLocalConfig((prev) => ({
      ...prev,
      classroomBindings: {
        ...prev.classroomBindings,
        [className]: room,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6" /> 系統參數設定
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-blue-600"
          >
            返回後台
          </button>
        </div>

        <div className="space-y-8">
          {/* Class Types & Basic Settings */}
          {["years", "semesters", "classTypes"].map((field) => (
            <div key={field}>
              <h3 className="font-bold text-lg text-gray-700 mb-2 capitalize">
                {field === "years"
                  ? "學年"
                  : field === "semesters"
                  ? "學期"
                  : "班級類別"}
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {localConfig[field].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    {item}
                    <button
                      onClick={() => handleRemoveItem(field, idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="border p-2 rounded w-64 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem(field);
                  }}
                  placeholder="輸入後按 + 新增"
                />
                <button
                  onClick={() => handleAddItem(field)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Classroom Binding Settings (New Feature) */}
          <div className="pt-4 border-t">
            <h3 className="font-bold text-lg text-gray-700 mb-4 flex items-center gap-2">
              <Link className="w-5 h-5" /> 班級教室綁定設定
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">班級名稱</th>
                    <th className="pb-2">綁定教室</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {localConfig.classTypes.map((cls) => (
                    <tr key={cls} className="hover:bg-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-800">
                        {cls}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBindingChange(cls, "A")}
                            className={`px-3 py-1 rounded border ${
                              localConfig.classroomBindings?.[cls] === "A"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            教室 A
                          </button>
                          <button
                            onClick={() => handleBindingChange(cls, "B")}
                            className={`px-3 py-1 rounded border ${
                              localConfig.classroomBindings?.[cls] === "B"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            教室 B
                          </button>
                          <button
                            onClick={() => {
                              const newBindings = {
                                ...localConfig.classroomBindings,
                              };
                              delete newBindings[cls];
                              setLocalConfig((prev) => ({
                                ...prev,
                                classroomBindings: newBindings,
                              }));
                            }}
                            className={`px-3 py-1 rounded border ${
                              !localConfig.classroomBindings?.[cls]
                                ? "bg-gray-500 text-white border-gray-500"
                                : "bg-white text-gray-400 border-gray-200"
                            }`}
                          >
                            未綁定 (可選)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-2">
                *
                綁定後，家長在劃位頁面切換到該班級時，系統將自動鎖定教室，無法切換。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end">
          <button
            onClick={() => onSave(localConfig)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Save className="w-5 h-5" /> 儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Add Student Modal Component ---
const AddStudentModal = ({ onClose, onSave, currentFilter }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white p-6 rounded-lg w-96 shadow-2xl">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" /> 新增學員
        </h3>

        <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
          <p>將加入至：</p>
          <p className="font-bold">
            {currentFilter.academicYear} / {currentFilter.semester}
          </p>
          <p className="font-bold">{currentFilter.classType}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              學生姓名
            </label>
            <input
              autoFocus
              className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="請輸入姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              聯絡電話
            </label>
            <input
              className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="請輸入電話"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              if (!name.trim() || !phone.trim()) return alert("請填寫完整資訊");
              onSave(name, phone);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow transition-colors"
          >
            確認新增
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SeatMap Component ---
const SeatMap = ({
  classroomKey,
  mode,
  filterData,
  registrations,
  onSelect,
  userPreferences,
  moveTarget,
}) => {
  const [zoom, setZoom] = useState(1);
  const config = CLASSROOMS[classroomKey];
  const { seats, cols, layout } = config;

  const getSeatStatus = (seatId) => {
    if (!registrations) return undefined;
    const relevantRegs = registrations.filter(
      (r) =>
        r.classroom === classroomKey &&
        r.classType === filterData.classType &&
        r.academicYear === filterData.academicYear &&
        r.semester === filterData.semester
    );
    return relevantRegs.find((r) => r.assignedSeat === seatId);
  };

  let occupiedCount = 0;
  seats.forEach((seat) => {
    if (getSeatStatus(seat.id)) occupiedCount++;
  });
  const remainingSeats = seats.length - occupiedCount;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative min-h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-4 z-10 relative">
        <h3 className="font-bold text-gray-700 text-lg">{config.name}</h3>
        <div className="flex gap-2 items-center">
          {mode === "select" && (
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
              <Armchair className="w-3 h-3" /> 剩餘：{remainingSeats}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-auto flex-1 border border-gray-100 rounded-lg bg-gray-50 relative p-4">
        {moveTarget && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold z-20 shadow border border-amber-300 animate-pulse">
            請點擊空位以安排: {moveTarget.studentName}
          </div>
        )}

        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 0.2s",
          }}
          className="w-full"
        >
          <div
            className="relative border-t-2 border-b-2 border-gray-300 py-12 px-2 flex flex-col items-center justify-center mx-auto"
            style={{ width: "fit-content" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-gray-200 rounded-b-md shadow-sm flex items-center justify-center text-[10px] text-gray-500 font-bold tracking-widest z-0">
              屏幕區
            </div>
            <div
              className={`absolute bg-gray-300 shadow-inner flex items-center justify-center text-xs text-gray-500 font-bold uppercase tracking-widest z-10
              ${
                layout.podium === "top"
                  ? "top-0 left-1/2 -translate-x-1/2 w-1/2 h-6 rounded-b-lg"
                  : ""
              }
              ${
                layout.podium === "top-left"
                  ? "top-0 left-0 mt-4 ml-2 w-1/3 h-6 rounded-b-lg"
                  : ""
              }
              ${
                layout.podium === "top-right"
                  ? "top-0 right-0 mt-4 mr-2 w-1/3 h-6 rounded-b-lg"
                  : ""
              }
            `}
            >
              講台
            </div>
            <div
              className={`absolute flex items-center gap-1 text-gray-500 font-bold text-xs bg-white px-2 py-1 border border-gray-200 rounded shadow-sm z-10 whitespace-nowrap
              ${layout.door === "top-left" ? "top-0 left-0 -mt-3 -ml-2" : ""}
              ${
                layout.door === "bottom-left"
                  ? "bottom-0 left-0 -mb-3 -ml-2"
                  : ""
              }
            `}
            >
              <DoorOpen className="w-4 h-4" /> 出入口
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, minmax(40px, 1fr))`,
                gap: "0.4rem",
                marginTop: "1rem",
                marginBottom: "1rem",
              }}
            >
              {seats.map((seat) => {
                const occupant = getSeatStatus(seat.id);
                let seatColor =
                  "bg-white border-2 border-gray-300 hover:border-blue-400";
                let content = (
                  <span className="text-gray-400 font-medium text-xs">
                    {seat.label}
                  </span>
                );
                let isClickable = true;

                if (mode === "select") {
                  if (occupant) {
                    seatColor =
                      "bg-gray-200 border-transparent cursor-not-allowed";
                    content = (
                      <span className="text-gray-300 text-[10px]">已劃位</span>
                    );
                    isClickable = false;
                  }
                  if (userPreferences && userPreferences.includes(seat.id)) {
                    seatColor =
                      "bg-blue-500 border-blue-600 text-white shadow-md";
                    content = (
                      <span className="font-bold text-lg">
                        {userPreferences.indexOf(seat.id) + 1}
                      </span>
                    );
                  }
                } else if (mode === "admin") {
                  if (moveTarget && !occupant) {
                    seatColor =
                      "bg-amber-50 border-amber-400 cursor-pointer animate-pulse";
                  } else if (occupant) {
                    seatColor = "bg-indigo-100 border-indigo-300";
                    content = (
                      <div className="flex flex-col items-center leading-tight overflow-hidden justify-center w-full h-full">
                        <span className="text-indigo-900 font-bold text-[9px] truncate w-full text-center">
                          {occupant.studentName}
                        </span>
                      </div>
                    );
                  }
                } else if (mode === "check") {
                  if (occupant) {
                    if (
                      filterData.myPhone &&
                      occupant.parentPhone === filterData.myPhone
                    ) {
                      seatColor =
                        "bg-green-100 border-green-500 ring-2 ring-green-200";
                      content = (
                        <div className="flex flex-col items-center justify-center w-full h-full">
                          <CheckCircle className="w-3 h-3 text-green-600 mb-1" />
                          <span className="text-green-800 font-bold text-[10px] truncate">
                            {occupant.studentName}
                          </span>
                        </div>
                      );
                    } else {
                      // Others' Seats
                      seatColor = "bg-gray-100 border-gray-200";
                      content = (
                        <span className="text-gray-400 text-[10px] md:text-xs">
                          已劃位
                        </span>
                      );
                    }
                  }
                }

                return (
                  <div
                    key={seat.id}
                    onClick={() => {
                      if (isClickable && onSelect) {
                        onSelect(seat.id);
                      }
                    }}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-200 relative p-1 ${seatColor} ${
                      isClickable ? "cursor-pointer active:scale-95" : ""
                    }`}
                    style={{ width: "50px", height: "50px" }}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Main Component
// ==========================================
export default function SeatAllocationSystem() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [view, setView] = useState("home");

  const [systemConfig, setSystemConfig] = useState({
    classTypes: DEFAULT_CLASS_TYPES,
    years: DEFAULT_YEARS,
    semesters: DEFAULT_SEMESTERS,
    classroomBindings: DEFAULT_CLASSROOM_BINDINGS,
  });
  const [configLoading, setConfigLoading] = useState(true);

  const [downloading, setDownloading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    defaultValue: "",
    onConfirm: null,
    customContent: null,
  });
  const [showAddStudent, setShowAddStudent] = useState(false);

  const [formData, setFormData] = useState({
    studentName: "",
    parentPhone: "",
    academicYear: "114",
    semester: "上學期",
    classType: DEFAULT_CLASS_TYPES[0],
    classroom: "A",
    preferences: [],
  });

  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: "",
  });
  const [adminFilter, setAdminFilter] = useState({
    classType: DEFAULT_CLASS_TYPES[0],
    academicYear: "114",
    semester: "上學期",
  });

  const [moveModeTarget, setMoveModeTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [draggedItem, setDraggedItem] = useState(null);

  const [searchPhone, setSearchPhone] = useState("");
  const [searchClass, setSearchClass] = useState(DEFAULT_CLASS_TYPES[0]);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundRecord, setFoundRecord] = useState(null);

  // --- Effects ---
  useEffect(() => {
    const linkId = "tailwind-cdn";
    if (!document.getElementById(linkId)) {
      const script = document.createElement("script");
      script.id = linkId;
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
    const h2cId = "html2canvas-script";
    if (!document.getElementById(h2cId)) {
      const script = document.createElement("script");
      script.id = h2cId;
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      if (!auth || !db) return;
      try {
        // We try to restore a session if exists, otherwise sign in anon
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth init:", error);
      }

      try {
        const configDoc = await getDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "system_settings",
            "config"
          )
        );
        if (configDoc.exists()) {
          const data = configDoc.data();
          setSystemConfig({
            classTypes: data.classTypes || DEFAULT_CLASS_TYPES,
            years: data.years || DEFAULT_YEARS,
            semesters: data.semesters || DEFAULT_SEMESTERS,
            classroomBindings:
              data.classroomBindings || DEFAULT_CLASSROOM_BINDINGS,
          });
          if (data.classTypes && data.classTypes.length > 0) {
            setFormData((prev) => ({ ...prev, classType: data.classTypes[0] }));
            setAdminFilter((prev) => ({
              ...prev,
              classType: data.classTypes[0],
            }));
            setSearchClass(data.classTypes[0]);
          }
        }
      } catch (e) {
        // Suppress error display to user for config issues, use defaults
        console.warn("Config load skipped, using defaults");
      } finally {
        setConfigLoading(false);
      }
    };

    initApp();

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        // Security Check: If email matches, grant admin access
        if (currentUser && currentUser.email === "chenti.chinese@gmail.com") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // If we were in admin view but lost admin rights, kick to home
          if (view.startsWith("admin")) setView("home");
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Sync classroom with classType based on bindings
  useEffect(() => {
    const binding = systemConfig.classroomBindings?.[formData.classType];
    if (binding) {
      setFormData((prev) => ({ ...prev, classroom: binding, preferences: [] }));
    }
  }, [formData.classType, systemConfig.classroomBindings]);

  useEffect(() => {
    if (!user || !db) {
      setRegistrations([]);
      if (!db) setLoading(false);
      return;
    }
    setLoading(true);
    setPermissionError(false);
    let q;
    const baseRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "registrations"
    );
    let targetYear, targetSemester, targetClass;

    if (view === "admin-dashboard") {
      targetYear = adminFilter.academicYear;
      targetSemester = adminFilter.semester;
      targetClass = adminFilter.classType;
    } else if (view === "parent-form") {
      targetYear = formData.academicYear;
      targetSemester = formData.semester;
      targetClass = formData.classType;
    } else if (view === "parent-check" && foundRecord) {
      targetYear = foundRecord.academicYear;
      targetSemester = foundRecord.semester;
      targetClass = foundRecord.classType;
    } else {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    q = query(
      baseRef,
      where("academicYear", "==", targetYear),
      where("semester", "==", targetSemester),
      where("classType", "==", targetClass)
    );
    const unsubData = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRegistrations(data);
        setLoading(false);
      },
      (error) => {
        if (error.code === "permission-denied") setPermissionError(true);
        setLoading(false);
      }
    );
    return () => unsubData();
  }, [
    user,
    view,
    adminFilter,
    formData.academicYear,
    formData.semester,
    formData.classType,
    foundRecord,
  ]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [adminFilter, view]);
  useEffect(() => {
    const savedName = localStorage.getItem("sas_studentName");
    const savedPhone = localStorage.getItem("sas_parentPhone");
    if (savedName || savedPhone)
      setFormData((prev) => ({
        ...prev,
        studentName: savedName || prev.studentName,
        parentPhone: savedPhone || prev.parentPhone,
      }));
  }, []);

  // --- Handlers ---
  const closeModal = () =>
    setModal((prev) => ({ ...prev, isOpen: false, customContent: null }));
  const showAlert = (message, title = "系統提示") =>
    setModal({
      isOpen: true,
      type: "alert",
      title,
      message,
      onConfirm: closeModal,
    });
  const showConfirm = (message, onConfirm, title = "確認操作") =>
    setModal({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeModal();
      },
    });
  const showPrompt = (title, message, defaultValue, onConfirm) =>
    setModal({
      isOpen: true,
      type: "prompt",
      title,
      message,
      defaultValue,
      onConfirm: (val) => {
        onConfirm(val);
      },
    });

  // SECURITY UPGRADE: Real Firebase Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(
        auth,
        adminCredentials.username,
        adminCredentials.password
      );
      // onAuthStateChanged will detect email and set isAdmin=true
      setView("admin-dashboard");
    } catch (error) {
      console.error(error);
      showAlert("登入失敗：請確認 Email 與密碼正確。");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    await signInAnonymously(auth); // Re-login as guest
    setView("home");
  };

  const handleSaveConfig = async (newConfig) => {
    try {
      await setDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "system_settings",
          "config"
        ),
        newConfig
      );
      setSystemConfig(newConfig);
      showAlert("系統設定已儲存！");
      setView("admin-dashboard");
    } catch (e) {
      showAlert("儲存失敗，請檢查權限。");
    }
  };

  // --- Updated Handle Parent Entry (Chained Alerts with New Message) ---
  const handleParentEnter = () => {
    setModal({
      isOpen: true,
      type: "alert",
      title: "劃位須知",
      message:
        "本劃位系統僅供「選擇實體上課」的學生使用。\n\n若您是線上課程學員，請勿在此劃位。",
      onConfirm: () => {
        // Show second alert
        setModal({
          isOpen: true,
          type: "alert",
          title: "上課規範提醒",
          message:
            "為保障現場上課同學權益，實體上課若因故直播上課達三次者，第四次改以直播上課時系統將自動取消現場座位。",
          onConfirm: () => {
            closeModal();
            setView("parent-form");
          },
        });
      },
    });
  };

  const handleSeatSelect = (seatId) => {
    const occupant = registrations.find(
      (r) => r.assignedSeat === seatId && r.classroom === formData.classroom
    );
    if (occupant) {
      showAlert(`此座位 (${seatId}) 已被劃位，請選擇其他座位。`);
      return;
    }
    if (formData.preferences.includes(seatId))
      setFormData((p) => ({
        ...p,
        preferences: p.preferences.filter((id) => id !== seatId),
      }));
    else if (formData.preferences.length < 3)
      setFormData((p) => ({ ...p, preferences: [...p.preferences, seatId] }));
    else showAlert("最多選擇三個優先座位");
  };

  const updateSeat = async (regId, seat) => {
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "registrations", regId),
        { assignedSeat: seat, status: seat ? "confirmed" : "pending" }
      );
    } catch (e) {}
  };

  const handleAdminSeatClick = (seatId, classroomKey) => {
    if (!moveModeTarget) return;
    const occupied = registrations.find(
      (r) => r.assignedSeat === seatId && r.classroom === classroomKey
    );
    if (occupied) {
      if (
        !confirm(
          `座位 ${seatId} 已被 ${occupied.studentName} 佔用，確定要強制覆蓋嗎？`
        )
      )
        return;
      updateSeat(occupied.id, null);
    }
    const batch = writeBatch(db);
    if (moveModeTarget.assignedSeat) {
      const oldLockId = getLockId(
        moveModeTarget.academicYear,
        moveModeTarget.semester,
        moveModeTarget.classType,
        moveModeTarget.classroom,
        moveModeTarget.assignedSeat
      );
      batch.delete(
        doc(db, "artifacts", appId, "public", "data", "seat_locks", oldLockId)
      );
    }
    batch.update(
      doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "registrations",
        moveModeTarget.id
      ),
      { assignedSeat: seatId, classroom: classroomKey, status: "confirmed" }
    );
    const newLockId = getLockId(
      moveModeTarget.academicYear,
      moveModeTarget.semester,
      moveModeTarget.classType,
      classroomKey,
      seatId
    );
    batch.set(
      doc(db, "artifacts", appId, "public", "data", "seat_locks", newLockId),
      {
        studentName: moveModeTarget.studentName,
        timestamp: serverTimestamp(),
        type: "manual",
      }
    );
    batch
      .commit()
      .then(() => {
        setMoveModeTarget(null);
        showAlert(`${moveModeTarget.studentName} 已安排至 ${seatId}`);
      })
      .catch((e) => showAlert("更新失敗"));
  };
  const handleSelectAll = (e, filteredRegs) => {
    if (e.target.checked)
      setSelectedIds(new Set(filteredRegs.map((r) => r.id)));
    else setSelectedIds(new Set());
  };
  const handleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    showConfirm(
      `確定要刪除選取的 ${selectedIds.size} 筆資料嗎？\n此操作無法復原。`,
      async () => {
        setLoading(true);
        try {
          const batch = writeBatch(db);
          const regsToDelete = registrations.filter((r) =>
            selectedIds.has(r.id)
          );
          regsToDelete.forEach((reg) => {
            batch.delete(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "registrations",
                reg.id
              )
            );
            if (reg.assignedSeat) {
              const lockId = getLockId(
                reg.academicYear,
                reg.semester,
                reg.classType,
                reg.classroom,
                reg.assignedSeat
              );
              batch.delete(
                doc(
                  db,
                  "artifacts",
                  appId,
                  "public",
                  "data",
                  "seat_locks",
                  lockId
                )
              );
            }
          });
          await batch.commit();
          setSelectedIds(new Set());
          setLoading(false);
          showAlert("批量刪除成功！");
        } catch (e) {
          console.error(e);
          setLoading(false);
          showAlert("批量刪除失敗，請檢查權限。");
        }
      }
    );
  };
  const handleAutoAssign = () => {
    if (!isAdmin) return;
    showConfirm("將根據「填表時間」重新分配座位，確定嗎？", async () => {
      try {
        setLoading(true);
        const sortedRegs = [...registrations].sort(
          (a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
        );
        const batch = writeBatch(db);
        const occupied = new Set();
        let assignedCount = 0;
        registrations.forEach((reg) => {
          if (reg.assignedSeat) {
            const lockId = getLockId(
              reg.academicYear,
              reg.semester,
              reg.classType,
              reg.classroom,
              reg.assignedSeat
            );
            batch.delete(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "seat_locks",
                lockId
              )
            );
          }
        });
        sortedRegs.forEach((reg) => {
          let allocated = null;
          if (reg.preferences) {
            for (const pref of reg.preferences) {
              if (!occupied.has(pref)) {
                allocated = pref;
                break;
              }
            }
          }
          if (allocated) {
            occupied.add(allocated);
            assignedCount++;
          }
          batch.update(
            doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "registrations",
              reg.id
            ),
            {
              assignedSeat: allocated,
              status: allocated ? "confirmed" : "pending",
            }
          );
          if (allocated) {
            const lockId = getLockId(
              reg.academicYear,
              reg.semester,
              reg.classType,
              reg.classroom,
              allocated
            );
            batch.set(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "seat_locks",
                lockId
              ),
              {
                studentName: reg.studentName,
                timestamp: serverTimestamp(),
                type: "auto-assign",
              }
            );
          }
        });
        await batch.commit();
        setLoading(false);
        showAlert(`分配完成！成功安排：${assignedCount} 位`);
      } catch (error) {
        setLoading(false);
        showAlert("分配發生錯誤");
      }
    });
  };
  const handleManualSeatEdit = (reg) => {
    showPrompt(
      "修改座位",
      `請輸入 ${reg.studentName} 的新座位代號 (例如 A-1-1)：`,
      reg.assignedSeat || "",
      (inputValue) => {
        const newSeat = inputValue.trim().toUpperCase();
        if (!newSeat) {
          setModal((prev) => ({ ...prev, isOpen: false }));
          setTimeout(
            () =>
              showConfirm("確定清除座位？", async () => {
                const batch = writeBatch(db);
                batch.update(
                  doc(
                    db,
                    "artifacts",
                    appId,
                    "public",
                    "data",
                    "registrations",
                    reg.id
                  ),
                  { assignedSeat: null, status: "pending" }
                );
                if (reg.assignedSeat) {
                  const lockId = getLockId(
                    reg.academicYear,
                    reg.semester,
                    reg.classType,
                    reg.classroom,
                    reg.assignedSeat
                  );
                  batch.delete(
                    doc(
                      db,
                      "artifacts",
                      appId,
                      "public",
                      "data",
                      "seat_locks",
                      oldLock
                    )
                  );
                }
                await batch.commit();
              }),
            100
          );
          return;
        }
        const conflict = registrations.find(
          (r) => r.assignedSeat === newSeat && r.id !== reg.id
        );
        const doUpdate = async (force = false) => {
          try {
            const batch = writeBatch(db);
            if (reg.assignedSeat) {
              const oldLock = getLockId(
                reg.academicYear,
                reg.semester,
                reg.classType,
                reg.classroom,
                reg.assignedSeat
              );
              batch.delete(
                doc(
                  db,
                  "artifacts",
                  appId,
                  "public",
                  "data",
                  "seat_locks",
                  oldLock
                )
              );
            }
            if (force && conflict) {
              batch.update(
                doc(
                  db,
                  "artifacts",
                  appId,
                  "public",
                  "data",
                  "registrations",
                  conflict.id
                ),
                { assignedSeat: null, status: "kicked" }
              );
            }
            const newLock = getLockId(
              reg.academicYear,
              reg.semester,
              reg.classType,
              reg.classroom,
              newSeat
            );
            batch.set(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "seat_locks",
                newLock
              ),
              {
                studentName: reg.studentName,
                timestamp: serverTimestamp(),
                type: "manual",
              }
            );
            batch.update(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "registrations",
                reg.id
              ),
              { assignedSeat: newSeat, status: "confirmed" }
            );
            await batch.commit();
            closeModal();
          } catch (e) {
            showAlert("更新失敗");
          }
        };
        if (conflict) {
          setModal((prev) => ({ ...prev, isOpen: false }));
          setTimeout(
            () =>
              showConfirm(`座位 ${newSeat} 已被佔用，確定強制分配？`, () =>
                doUpdate(true)
              ),
            100
          );
        } else {
          doUpdate(false);
        }
      }
    );
  };
  const handleEditTimestamp = (reg) => {
    let defaultTimeStr = "";
    if (reg.timestamp) {
      const d = new Date(reg.timestamp.seconds * 1000);
      defaultTimeStr = `${d.getFullYear()}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d
        .getHours()
        .toString()
        .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
    }
    showPrompt(
      "修正時間 (YYYY/MM/DD HH:mm:ss)",
      "請輸入新時間：",
      defaultTimeStr,
      async (val) => {
        const newDate = new Date(val);
        if (isNaN(newDate.getTime())) {
          alert("格式錯誤");
          return;
        }
        try {
          await updateDoc(
            doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "registrations",
              reg.id
            ),
            { timestamp: Timestamp.fromDate(newDate) }
          );
          closeModal();
        } catch (e) {
          showAlert("更新失敗");
        }
      }
    );
  };
  const handleParentSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (
      !formData.studentName.trim() ||
      !formData.parentPhone.match(/^[0-9]{8,10}$/) ||
      formData.preferences.length === 0
    ) {
      showAlert("請完整填寫資料並選擇志願");
      return;
    }
    setLoading(true);
    const dupQuery = query(
      collection(db, "artifacts", appId, "public", "data", "registrations"),
      where("parentPhone", "==", formData.parentPhone),
      where("classType", "==", formData.classType),
      where("academicYear", "==", formData.academicYear),
      where("semester", "==", formData.semester)
    );
    const dupDocs = await getDocs(dupQuery);
    if (!dupDocs.empty) {
      setLoading(false);
      showAlert("您已在該班級提交過申請，請勿重複報名。\n如需修改請聯繫櫃台。");
      return;
    }
    const prefsText = formData.preferences.join(", ");
    showConfirm(
      `確認報名資訊：\n姓名：${formData.studentName}\n班級：${formData.classType}\n志願：${prefsText}\n\n確定送出申請嗎？(座位由後台安排)`,
      async () => {
        try {
          await addDoc(
            collection(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "registrations"
            ),
            {
              ...formData,
              assignedSeat: null,
              timestamp: serverTimestamp(),
              status: "pending",
              userId: user.uid,
            }
          );
          setLoading(false);
          localStorage.setItem("sas_studentName", formData.studentName);
          localStorage.setItem("sas_parentPhone", formData.parentPhone);
          showAlert("報名申請已送出！");
          setView("home");
          setFormData({ ...formData, preferences: [] });
        } catch (error) {
          setLoading(false);
          if (error.code === "permission-denied")
            showAlert("寫入失敗：權限不足。");
          else showAlert("系統忙碌中，請稍後重試。");
        }
      }
    );
  };
  const handleGenerateTestData = () => {
    if (!isAdmin) return;
    showConfirm(
      `生成 10 筆測試資料到：${adminFilter.classType}？`,
      async () => {
        setLoading(true);
        try {
          const batch = writeBatch(db);
          const names = [
            "陳小明",
            "林美華",
            "張志豪",
            "李雅婷",
            "王大明",
            "趙曉雯",
            "孫小剛",
            "吳淑芬",
            "鄭家豪",
            "楊怡君",
          ];
          for (let i = 0; i < 10; i++) {
            const docRef = doc(
              collection(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "registrations"
              )
            );
            const classroom = Math.random() > 0.5 ? "A" : "B";
            const seats = CLASSROOMS[classroom].seats.map((s) => s.id);
            const prefs = seats.sort(() => 0.5 - Math.random()).slice(0, 3);
            batch.set(docRef, {
              studentName: `測試-${names[i]}`,
              parentPhone: `09${Math.floor(Math.random() * 100000000)
                .toString()
                .padStart(8, "0")}`,
              academicYear: adminFilter.academicYear,
              semester: adminFilter.semester,
              classType: adminFilter.classType,
              classroom: classroom,
              preferences: prefs,
              assignedSeat: null,
              status: "pending",
              timestamp: serverTimestamp(),
              userId: "test",
            });
          }
          await batch.commit();
          setLoading(false);
          showAlert("生成成功！");
        } catch (e) {
          setLoading(false);
          showAlert("生成失敗");
        }
      }
    );
  };
  const handleDownloadMap = async () => {
    if (!window.html2canvas) {
      showAlert("初始化中...");
      return;
    }
    setDownloading(true);
    const element = document.getElementById("seat-map-capture-area");
    if (element) {
      try {
        const originalStyle = element.style.cssText;
        element.style.width = "fit-content";
        element.style.minWidth = "800px";
        const canvas = await window.html2canvas(element, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          onclone: (clonedDoc) => {
            const elements = clonedDoc.querySelectorAll(".truncate");
            elements.forEach((el) => {
              el.style.overflow = "visible";
              el.style.textOverflow = "clip";
              el.style.whiteSpace = "normal";
            });
          },
        });
        element.style.cssText = originalStyle;
        const link = document.createElement("a");
        link.download = `${adminFilter.academicYear}_${adminFilter.semester}_${adminFilter.classType}_座位表.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Screenshot failed:", err);
        showAlert("圖片產生失敗。");
      }
    } else {
      showAlert("找不到區域。");
    }
    setDownloading(false);
  };
  const handleExportCSV = (filteredRegs) => {
    const bom = "\uFEFF";
    const header =
      "繳費順序,劃位時間,學員姓名,家長電話,教室,座位,志願序,狀態\n";
    const rows = filteredRegs
      .map((reg, index) => {
        const prefs = `"${reg.preferences.join(", ")}"`;
        const status = reg.assignedSeat ? "已確認" : "待安排";
        let timeStr = "";
        if (reg.timestamp) {
          const d = new Date(reg.timestamp.seconds * 1000);
          timeStr = `${d.getFullYear()}/${
            d.getMonth() + 1
          }/${d.getDate()} ${d.getHours()}:${d
            .getMinutes()
            .toString()
            .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
        }
        return `${index + 1},${timeStr},${reg.studentName},'${
          reg.parentPhone
        },${reg.classroom},${reg.assignedSeat || ""},${prefs},${status}`;
      })
      .join("\n");
    const blob = new Blob([bom + header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${adminFilter.classType}_座位表.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      showAlert("請輸入電話號碼");
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "artifacts", appId, "public", "data", "registrations"),
        where("parentPhone", "==", searchPhone),
        where("classType", "==", searchClass)
      );
      const snap = await new Promise((resolve) => {
        const unsub = onSnapshot(q, (s) => {
          resolve(s);
          unsub();
        });
      });
      const records = snap.docs.map((d) => d.data());
      setFoundRecord(records.length > 0 ? records[0] : null);
      setHasSearched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Add Student (New) ---
  const handleAdminAddStudent = async (name, phone) => {
    if (!name || !phone) return;
    setLoading(true);
    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "registrations"),
        {
          studentName: name,
          parentPhone: phone,
          academicYear: adminFilter.academicYear,
          semester: adminFilter.semester,
          classType: adminFilter.classType,
          classroom: "A", // Default to A, can be changed later
          preferences: [],
          assignedSeat: null,
          status: "pending",
          timestamp: serverTimestamp(),
          userId: user?.uid || "admin-manual",
        }
      );
      setLoading(false);
      setShowAddStudent(false); // Close modal
      showAlert("學員新增成功！");
    } catch (e) {
      console.error(e);
      setLoading(false);
      showAlert("新增失敗");
    }
  };

  // --- Drag and Drop Handlers (Enhanced) ---
  const handleDragStart = (e, reg) => {
    setDraggedItem(reg);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (targetReg) => {
    if (!draggedItem || draggedItem.id === targetReg.id) return;
    const currentList = [...registrations].sort((a, b) => {
      const tA = a.timestamp?.toMillis
        ? a.timestamp.toMillis()
        : a.timestamp?.seconds * 1000 || 0;
      const tB = b.timestamp?.toMillis
        ? b.timestamp.toMillis()
        : b.timestamp?.seconds * 1000 || 0;
      return tA - tB;
    });

    const originalDragIndex = currentList.findIndex(
      (r) => r.id === draggedItem.id
    );
    const originalTargetIndex = currentList.findIndex(
      (r) => r.id === targetReg.id
    );
    const isDraggingDown = originalDragIndex < originalTargetIndex;

    const listWithoutDragged = currentList.filter(
      (r) => r.id !== draggedItem.id
    );
    const targetIndexInFiltered = listWithoutDragged.findIndex(
      (r) => r.id === targetReg.id
    );

    if (targetIndexInFiltered === -1) return;

    let newTimeMillis;
    const getMillis = (item) =>
      item?.timestamp?.toMillis
        ? item.timestamp.toMillis()
        : item?.timestamp?.seconds * 1000 || Date.now();
    const targetTime = getMillis(targetReg);

    if (isDraggingDown) {
      const itemAfterTarget = listWithoutDragged[targetIndexInFiltered + 1];
      const nextTime = itemAfterTarget
        ? getMillis(itemAfterTarget)
        : targetTime + 60000;
      newTimeMillis = (targetTime + nextTime) / 2;
    } else {
      const itemBeforeTarget = listWithoutDragged[targetIndexInFiltered - 1];
      const prevTime = itemBeforeTarget
        ? getMillis(itemBeforeTarget)
        : targetTime - 60000;
      newTimeMillis = (prevTime + targetTime) / 2;
    }

    try {
      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "registrations",
          draggedItem.id
        ),
        {
          timestamp: Timestamp.fromMillis(newTimeMillis),
        }
      );
      setDraggedItem(null);
    } catch (e) {
      console.error(e);
      showAlert("排序更新失敗");
    }
  };

  const handleDeleteRegistration = (reg) => {
    if (!isAdmin) return;
    showConfirm(
      "確定要移除這位學員的劃位資料嗎？此操作無法復原。",
      async () => {
        try {
          const batch = writeBatch(db);
          batch.delete(
            doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "registrations",
              reg.id
            )
          );
          if (reg.assignedSeat) {
            const lockId = getLockId(
              reg.academicYear,
              reg.semester,
              reg.classType,
              reg.classroom,
              reg.assignedSeat
            );
            batch.delete(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "seat_locks",
                lockId
              )
            );
          }
          await batch.commit();
        } catch (e) {
          showAlert("刪除失敗");
        }
      }
    );
  };

  // --- Render Content ---
  const renderContent = () => {
    if (permissionError)
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center text-red-500">
          <ShieldAlert className="w-12 h-12 mb-4" />
          權限不足，請檢查 Firestore Rules
        </div>
      );
    if (!db && view === "home")
      return <div className="p-8 text-center">請設定 Firebase Config</div>;
    if (view === "admin-settings")
      return (
        <SettingsView
          currentConfig={systemConfig}
          onSave={handleSaveConfig}
          onCancel={() => setView("admin-dashboard")}
        />
      );

    if (view === "home")
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex flex-col gap-2">
              <span>陳蒂國文</span>
              <span>實體課程劃位系統</span>
            </h1>
            <div className="space-y-4">
              <button
                onClick={handleParentEnter}
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg flex items-center justify-center gap-3"
              >
                <LayoutGrid /> 家長 / 學生 劃位
              </button>
              <button
                onClick={() => setView("parent-check")}
                className="w-full py-4 px-6 bg-white border-2 border-blue-100 hover:bg-blue-50 text-blue-700 rounded-xl font-medium flex items-center justify-center gap-3"
              >
                <Search /> 查詢我的座位
              </button>
              <div className="mt-8 text-center">
                <button
                  onClick={() => setView("admin-login")}
                  className="text-gray-300 hover:text-gray-500 text-xs flex items-center justify-center gap-1 mx-auto"
                >
                  <Shield className="w-3 h-3" /> 管理員登入
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    if (view === "parent-form") {
      const binding = systemConfig.classroomBindings?.[formData.classType];
      const isBound = !!binding;
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setView("home")}
              className="mb-6 text-gray-500"
            >
              ← 返回首頁
            </button>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-blue-600 px-6 py-4 text-white">
                <h2 className="text-xl font-bold">學員劃位申請</h2>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academicYear: e.target.value,
                        })
                      }
                      className="border p-2 rounded"
                    >
                      {systemConfig.years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      className="border p-2 rounded"
                    >
                      {systemConfig.semesters.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={formData.classType}
                    onChange={(e) =>
                      setFormData({ ...formData, classType: e.target.value })
                    }
                    className="border p-2 rounded w-full"
                  >
                    {systemConfig.classTypes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="學生姓名"
                    value={formData.studentName}
                    onChange={(e) =>
                      setFormData({ ...formData, studentName: e.target.value })
                    }
                    className="border p-2 rounded w-full"
                  />
                  <input
                    type="tel"
                    placeholder="聯絡電話"
                    value={formData.parentPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, parentPhone: e.target.value })
                    }
                    className="border p-2 rounded w-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          classroom: "A",
                          preferences: [],
                        })
                      }
                      className={`flex-1 p-2 rounded flex items-center justify-center gap-1 ${
                        formData.classroom === "A"
                          ? "bg-blue-100 text-blue-600 font-bold ring-2 ring-blue-200"
                          : "bg-gray-100 text-gray-500"
                      } ${
                        isBound && binding !== "A"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={isBound && binding !== "A"}
                    >
                      教室 A{" "}
                      {isBound && binding === "A" && (
                        <span className="text-xs bg-blue-600 text-white px-1 rounded">
                          指定
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          classroom: "B",
                          preferences: [],
                        })
                      }
                      className={`flex-1 p-2 rounded flex items-center justify-center gap-1 ${
                        formData.classroom === "B"
                          ? "bg-blue-100 text-blue-600 font-bold ring-2 ring-blue-200"
                          : "bg-gray-100 text-gray-500"
                      } ${
                        isBound && binding !== "B"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={isBound && binding !== "B"}
                    >
                      教室 B{" "}
                      {isBound && binding === "B" && (
                        <span className="text-xs bg-blue-600 text-white px-1 rounded">
                          指定
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="bg-blue-50 p-4 rounded text-sm text-blue-800">
                    志願序: {formData.preferences.join(", ") || "尚未選擇"}{" "}
                    {formData.preferences.length > 0 && (
                      <button
                        onClick={() =>
                          setFormData({ ...formData, preferences: [] })
                        }
                        className="text-red-500 ml-2"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleParentSubmit}
                    className="w-full bg-blue-600 text-white p-3 rounded font-bold"
                  >
                    送出申請
                  </button>
                </div>
                <div>
                  <SeatMap
                    classroomKey={formData.classroom}
                    mode="select"
                    filterData={formData}
                    registrations={registrations}
                    onSelect={handleSeatSelect}
                    userPreferences={formData.preferences}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (view === "parent-check")
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setView("home")}
              className="mb-6 text-gray-500"
            >
              ← 返回首頁
            </button>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">查詢座位</h2>
              <div className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-50 p-4 rounded-xl">
                <div className="flex-1 space-y-4">
                  <input
                    type="tel"
                    placeholder="請輸入家長聯絡電話"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="w-full border p-3 rounded-lg outline-none"
                  />
                  <select
                    value={searchClass}
                    onChange={(e) => setSearchClass(e.target.value)}
                    className="w-full border p-3 rounded-lg outline-none"
                  >
                    {systemConfig.classTypes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSearch}
                    className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg font-bold"
                  >
                    查詢
                  </button>
                </div>
              </div>
              {hasSearched && foundRecord && (
                <div className="animate-fade-in">
                  <div className="mb-6 border-b pb-4">
                    <h3 className="text-lg font-bold">
                      {foundRecord.studentName}
                    </h3>
                    <p>
                      狀態:{" "}
                      <span
                        className={`font-bold text-xl ml-2 ${
                          foundRecord.assignedSeat
                            ? "text-green-600"
                            : "text-amber-500"
                        }`}
                      >
                        {foundRecord.assignedSeat
                          ? `✅ 已劃位 (${foundRecord.assignedSeat})`
                          : "⏳ 排程中 / 待安排"}
                      </span>
                    </p>
                  </div>
                  <div className="max-w-md mx-auto">
                    <SeatMap
                      classroomKey={foundRecord.classroom || "A"}
                      mode="check"
                      filterData={{
                        ...foundRecord,
                        myPhone: foundRecord.parentPhone,
                      }}
                      registrations={registrations}
                    />
                  </div>
                </div>
              )}
              {hasSearched && !foundRecord && (
                <div className="text-center p-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>查無劃位資料，請確認輸入資料是否正確</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    if (view === "admin-login")
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96">
            <h2 className="text-2xl text-white mb-6 text-center">後台管理</h2>
            <input
              type="text"
              placeholder="帳號"
              value={adminCredentials.username}
              onChange={(e) =>
                setAdminCredentials({
                  ...adminCredentials,
                  username: e.target.value,
                })
              }
              className="w-full p-3 mb-4 rounded bg-gray-700 text-white border border-gray-600"
            />
            <input
              type="password"
              placeholder="密碼"
              value={adminCredentials.password}
              onChange={(e) =>
                setAdminCredentials({
                  ...adminCredentials,
                  password: e.target.value,
                })
              }
              className="w-full p-3 mb-6 rounded bg-gray-700 text-white border border-gray-600"
            />
            <button
              onClick={handleAdminLogin}
              className="w-full bg-blue-600 text-white p-3 rounded font-bold"
            >
              登入
            </button>
            <button
              onClick={() => setView("home")}
              className="w-full text-gray-500 mt-4 text-sm"
            >
              取消
            </button>
          </div>
        </div>
      );

    if (view === "admin-dashboard") {
      const filteredRegs = registrations
        .filter(
          (r) =>
            r.classType === adminFilter.classType &&
            r.academicYear === adminFilter.academicYear &&
            r.semester === adminFilter.semester
        )
        .sort(
          (a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)
        );
      const occupiedA = filteredRegs.filter(
        (r) =>
          r.classroom === "A" &&
          r.assignedSeat &&
          r.assignedSeat.startsWith("A")
      ).length;
      const occupiedB = filteredRegs.filter(
        (r) =>
          r.classroom === "B" &&
          r.assignedSeat &&
          r.assignedSeat.startsWith("B")
      ).length;
      return (
        <div className="min-h-screen bg-gray-100">
          <header className="bg-white shadow px-6 py-4 flex justify-between sticky top-0 z-10">
            <div className="font-bold text-gray-800 flex gap-2">
              <Shield className="text-blue-600" />
              後台管理
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView("admin-settings")}
                className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> 系統設定
              </button>
              <button
                onClick={handleLogout}
                className="text-red-500 px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> 登出
              </button>
            </div>
          </header>
          <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs font-bold uppercase tracking-wider">
                    <UserCheck className="w-4 h-4" /> 總報名人數
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {filteredRegs.length}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      人
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-blue-500 mb-1 text-xs font-bold uppercase tracking-wider">
                    <Armchair className="w-4 h-4" /> 教室 A 滿座率
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {occupiedA}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      / 40
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-green-500 mb-1 text-xs font-bold uppercase tracking-wider">
                    <Armchair className="w-4 h-4" /> 教室 B 滿座率
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {occupiedB}{" "}
                    <span className="text-sm font-normal text-gray-400">
                      / 24
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-700">班級報表</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddStudent(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg shadow-md flex items-center gap-1 text-sm font-bold transition-all"
                    >
                      <UserPlus className="w-4 h-4" /> 新增學員
                    </button>
                    <button
                      onClick={handleGenerateTestData}
                      className="bg-amber-500 text-white px-2 py-1 rounded text-xs"
                    >
                      測試數據
                    </button>
                    <button
                      onClick={handleAutoAssign}
                      className="bg-indigo-600 text-white px-2 py-1 rounded text-xs"
                    >
                      一鍵劃位
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={adminFilter.academicYear}
                    onChange={(e) =>
                      setAdminFilter({
                        ...adminFilter,
                        academicYear: e.target.value,
                      })
                    }
                    className="border p-2 rounded"
                  >
                    {systemConfig.years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <select
                    value={adminFilter.semester}
                    onChange={(e) =>
                      setAdminFilter({
                        ...adminFilter,
                        semester: e.target.value,
                      })
                    }
                    className="border p-2 rounded"
                  >
                    {systemConfig.semesters.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={adminFilter.classType}
                    onChange={(e) =>
                      setAdminFilter({
                        ...adminFilter,
                        classType: e.target.value,
                      })
                    }
                    className="border p-2 rounded"
                  >
                    {systemConfig.classTypes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-gray-700">
                    學員名單 ({filteredRegs.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportCSV(filteredRegs)}
                      className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 border border-green-200"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> 匯出 CSV
                    </button>
                    {selectedIds.size > 0 && (
                      <button
                        onClick={handleBatchDelete}
                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" /> 刪除 {selectedIds.size}{" "}
                        筆
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 w-8">
                          <input
                            type="checkbox"
                            onChange={(e) => handleSelectAll(e, filteredRegs)}
                            checked={
                              filteredRegs.length > 0 &&
                              selectedIds.size === filteredRegs.length
                            }
                          />
                        </th>
                        <th className="p-2 text-left">繳費順序/填寫時間</th>
                        <th className="p-2 w-8"></th>
                        <th className="p-2 text-left">姓名</th>
                        <th className="p-2 text-left">電話</th>
                        <th className="p-2 text-left">座位</th>
                        <th className="p-2 text-left">志願序</th>
                        <th className="p-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegs.map((reg, idx) => (
                        <tr
                          key={reg.id}
                          className={`border-t ${
                            moveModeTarget?.id === reg.id ? "bg-amber-50" : ""
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, reg)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(reg)}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(reg.id)}
                              onChange={() => handleSelectOne(reg.id)}
                            />
                          </td>
                          <td className="p-2">
                            <div>#{idx + 1}</div>
                            <div className="text-xs text-gray-400">
                              {formatDate(reg.timestamp)}{" "}
                              <button
                                onClick={() => handleEditTimestamp(reg)}
                                className="hover:text-blue-500"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-2 cursor-move text-gray-400 hover:text-gray-600">
                            <GripVertical className="w-4 h-4" />
                          </td>
                          <td className="p-2 font-bold">{reg.studentName}</td>
                          <td className="p-2">{reg.parentPhone}</td>
                          <td className="p-2 flex items-center gap-2">
                            {reg.assignedSeat || (
                              <span className="text-red-400">待</span>
                            )}
                            <button
                              onClick={() => setMoveModeTarget(reg)}
                              className={`p-1 rounded ${
                                moveModeTarget?.id === reg.id
                                  ? "bg-amber-500 text-white"
                                  : "text-gray-400 hover:bg-gray-100"
                              }`}
                              title="點擊排位"
                            >
                              <Armchair className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="p-2 text-xs text-gray-500">
                            {reg.preferences?.join(", ")}
                          </td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => handleDeleteRegistration(reg)}
                              className="text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{adminFilter.classType}</h3>
                  </div>
                  <button
                    onClick={handleDownloadMap}
                    className="bg-white border hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-xs flex items-center gap-1"
                  >
                    {downloading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ImageDown className="w-3 h-3" />
                    )}{" "}
                    匯出顯示圖
                  </button>
                </div>
              </div>
              <div
                id="seat-map-capture-area"
                className="bg-white rounded-xl shadow-sm overflow-hidden p-4"
              >
                <div className="mb-8">
                  <SeatMap
                    classroomKey="A"
                    mode="admin"
                    filterData={adminFilter}
                    registrations={registrations}
                    onSelect={(id) => handleAdminSeatClick(id, "A")}
                    moveTarget={moveModeTarget}
                  />
                </div>
                <div>
                  <SeatMap
                    classroomKey="B"
                    mode="admin"
                    filterData={adminFilter}
                    registrations={registrations}
                    onSelect={(id) => handleAdminSeatClick(id, "B")}
                    moveTarget={moveModeTarget}
                  />
                </div>
              </div>
            </div>
            {selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50 animate-fade-in">
                <span className="font-bold">已選取 {selectedIds.size} 筆</span>
                <div className="h-4 w-px bg-gray-600"></div>
                <button
                  onClick={handleBatchDelete}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold"
                >
                  <Trash2 className="w-4 h-4" /> 批量刪除
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-gray-400 hover:text-gray-200 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Add Student Modal */}
            {showAddStudent && (
              <AddStudentModal
                onClose={() => setShowAddStudent(false)}
                onSave={handleAdminAddStudent}
                currentFilter={adminFilter}
              />
            )}
          </main>
        </div>
      );
    }
  };

  return (
    <>
      {renderContent()}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h3 className="font-bold text-lg mb-2">{modal.title}</h3>
            {modal.type === "custom" ? (
              modal.customContent
            ) : (
              <p className="mb-4 whitespace-pre-line">{modal.message}</p>
            )}
            {modal.type === "prompt" && (
              <input
                id="prompt-input"
                defaultValue={modal.defaultValue}
                className="border w-full p-2 mb-4 rounded"
              />
            )}
            <div className="flex justify-end gap-2">
              {modal.type !== "alert" && (
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  取消
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.type === "prompt")
                    modal.onConfirm(
                      document.getElementById("prompt-input").value
                    );
                  else if (modal.onConfirm) modal.onConfirm();
                  else closeModal();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
