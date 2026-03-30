import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getAllTasks, getEvents, createEvent, deleteEvent } from "../services/api";
import { hasPerm } from "../utils/permissions";

const DAYS_TR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_TR = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_LABELS = {
  backlog: "Backlog", todo: "To Do", in_progress: "In Progress",
  in_review: "In Review", done: "Done",
};

const STATUS_COLORS = {
  backlog: { bg: "rgba(139,143,163,0.15)", color: "#8b8fa3" },
  todo: { bg: "rgba(79,172,254,0.15)", color: "#4facfe" },
  in_progress: { bg: "rgba(254,225,64,0.15)", color: "#fee140" },
  in_review: { bg: "rgba(168,130,255,0.15)", color: "#a882ff" },
  done: { bg: "rgba(67,233,123,0.15)", color: "#43e97b" },
};

const PRIORITY_COLORS = {
  low: { border: "#43e97b", bg: "rgba(67,233,123,0.10)" },
  medium: { border: "#fee140", bg: "rgba(254,225,64,0.10)" },
  high: { border: "#ff6b6b", bg: "rgba(255,107,107,0.10)" },
};

const EVENT_COLORS = [
  "#667eea", "#764ba2", "#4facfe", "#43e97b", "#ff6b6b", "#ffa502", "#fee140", "#a882ff",
];

function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Calendar() {
  const navigate = useNavigate();
  const { user } = useOutletContext();
  const canAddEvent = hasPerm(user, "event_ekle");
  const canDeleteEvent = hasPerm(user, "event_sil");

  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", date: "", color: "#667eea" });

  const fetchData = async () => {
    try {
      const [tasksRes, eventsRes] = await Promise.all([getAllTasks(), getEvents()]);
      setTasks(tasksRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;
  const daysInMonth = lastDay.getDate();

  const calendarDays = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthLastDay - i, inMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, inMonth: true, date: new Date(year, month, d) });
  }
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({ day: d, inMonth: false, date: new Date(year, month + 1, d) });
  }

  // Group tasks by endDate
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (!task.endDate) return;
    const key = toDateKey(task.endDate);
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  });

  // Group events by date
  const eventsByDate = {};
  events.forEach((ev) => {
    const key = toDateKey(ev.date);
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  });

  const todayKey = toDateKey(new Date());
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const selectedDayKey = selectedDay ? toDateKey(selectedDay) : null;
  const selectedTasks = selectedDayKey ? (tasksByDate[selectedDayKey] || []) : [];
  const selectedEvents = selectedDayKey ? (eventsByDate[selectedDayKey] || []) : [];

  // Event CRUD
  const handleCreateEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.date) return;
    try {
      await createEvent(eventForm);
      setEventForm({ title: "", date: "", color: "#667eea" });
      setShowEventModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await deleteEvent(id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="empty-text">Loading...</p>;

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h2 className="page-title" style={{ marginBottom: 0 }}>Calendar</h2>
        <div className="calendar-nav">
          {canAddEvent && (
            <button
              className="btn btn-create"
              onClick={() => {
                setEventForm({ title: "", date: selectedDay ? toDateKey(selectedDay) : "", color: "#667eea" });
                setShowEventModal(true);
              }}
            >
              + Add Event
            </button>
          )}
          <button className="cal-nav-btn" onClick={prevMonth}>←</button>
          <span className="cal-nav-title">{MONTHS_TR[month]} {year}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>→</button>
          <button className="cal-today-btn" onClick={goToday}>Today</button>
        </div>
      </div>

      <div className="calendar-grid-wrapper">
        <div className="calendar-day-headers">
          {DAYS_TR.map((d) => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((cell, idx) => {
            const key = toDateKey(cell.date);
            const dayTasks = tasksByDate[key] || [];
            const dayEvents = eventsByDate[key] || [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDayKey;

            return (
              <div
                key={idx}
                className={`calendar-cell${!cell.inMonth ? " other-month" : ""}${isToday ? " today" : ""}${isSelected ? " selected" : ""}`}
                onClick={() => setSelectedDay(cell.date)}
              >
                <span className={`calendar-cell-day${isToday ? " today-num" : ""}`}>{cell.day}</span>

                <div className="calendar-cell-items">
                  {/* Events */}
                  {dayEvents.map((ev) => (
                    <div
                      key={ev._id}
                      className="cal-cell-event"
                      style={{ background: ev.color || "#667eea" }}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}

                  {/* Tasks */}
                  {dayTasks.slice(0, 2).map((t) => {
                    const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium;
                    const assigneeNames = t.assignees?.map((a) => a.name).join(", ") || "";
                    return (
                      <div
                        key={t._id}
                        className="cal-cell-task"
                        style={{ borderLeftColor: pc.border, background: pc.bg }}
                        title={`${t.title} — ${assigneeNames}`}
                      >
                        <span className="cal-cell-task-title">{t.title}</span>
                        <span className="cal-cell-task-assignee">{assigneeNames}</span>
                      </div>
                    );
                  })}
                  {dayTasks.length > 2 && (
                    <span className="cal-cell-more">+{dayTasks.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      <div className="calendar-detail-panel">
        {selectedDay ? (
          <>
            <h3 className="calendar-detail-title">
              {selectedDay.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              <span className="calendar-detail-count">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}
                {selectedEvents.length > 0 && ` · ${selectedEvents.length} event${selectedEvents.length !== 1 ? "s" : ""}`}
              </span>
            </h3>

            {/* Events */}
            {selectedEvents.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 12, color: "#8b8fa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Events</h4>
                <div className="calendar-detail-list">
                  {selectedEvents.map((ev) => (
                    <div key={ev._id} className="calendar-event-card" style={{ borderLeftColor: ev.color || "#667eea" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#e1e4e8" }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: "#8b8fa3", marginTop: 2 }}>
                          Added by {ev.createdBy?.name} {ev.createdBy?.surname || ""}
                        </div>
                      </div>
                      {canAddEvent && (
                        <button
                          className="task-delete-btn"
                          style={{ opacity: 1, color: "#666" }}
                          onClick={() => handleDeleteEvent(ev._id)}
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {selectedTasks.length === 0 && selectedEvents.length === 0 ? (
              <p style={{ color: "#555", fontSize: 14, padding: "20px 0" }}>No tasks or events on this day.</p>
            ) : selectedTasks.length > 0 && (
              <div>
                <h4 style={{ fontSize: 12, color: "#8b8fa3", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Tasks</h4>
                <div className="calendar-detail-list">
                  {selectedTasks.map((task) => {
                    const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
                    return (
                      <div
                        key={task._id}
                        className="calendar-detail-card"
                        style={{ borderLeft: `3px solid ${pc.border}` }}
                        onClick={() => navigate(`/app/projects/${task.project?._id}`)}
                      >
                        <div className="calendar-detail-info">
                          <div className="calendar-detail-task-title">{task.title}</div>
                          <div className="calendar-detail-task-meta">
                            <span style={{ color: task.project?.color || "#667eea" }}>{task.project?.name}</span>
                            <span style={{ color: "#8b8fa3" }}>
                              {task.assignees?.map((a) => a.name).join(", ")}
                            </span>
                          </div>
                        </div>
                        <div className="calendar-detail-badges">
                          <span className="badge" style={{ background: `${pc.border}18`, color: pc.border }}>
                            {task.priority}
                          </span>
                          <span className="badge" style={{ background: STATUS_COLORS[task.status]?.bg, color: STATUS_COLORS[task.status]?.color }}>
                            {STATUS_LABELS[task.status]}
                          </span>
                        </div>
                        {task.assignees?.length > 0 && (
                          <div className="calendar-detail-assignees">
                            {task.assignees.slice(0, 3).map((a) => (
                              <div key={a._id} className="task-card-assignee" title={`${a.name} ${a.surname || ""}`}>
                                {a.name?.charAt(0)}{a.surname?.charAt(0) || ""}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="task-card-assignee" style={{ background: "#333", fontSize: 9 }}>+{task.assignees.length - 3}</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: "#555", fontSize: 14, padding: "20px 0" }}>Select a day to see details.</p>
        )}
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content modal-form" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEventModal(false)}>✕</button>
            <h2 className="modal-title">New Event</h2>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Event name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {EVENT_COLORS.map((c) => (
                  <div
                    key={c}
                    className={`color-dot${eventForm.color === c ? " selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setEventForm({ ...eventForm, color: c })}
                  />
                ))}
              </div>
            </div>
            <button
              className="btn"
              onClick={handleCreateEvent}
              disabled={!eventForm.title.trim() || !eventForm.date}
            >
              Create Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
