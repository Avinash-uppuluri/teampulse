import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import "../part4.css";

const STATUSES = ["NOT_RUN", "PASSED", "FAILED", "BLOCKED"];

export default function TestCaseList({ projectId, refreshKey }) {
  const [cases, setCases] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [actualResult, setActualResult] = useState("");

  const load = () => {
    api
      .getTestCases({ project_id: projectId, status: statusFilter || undefined })
      .then(setCases)
      .catch(console.error);
  };

  useEffect(load, [projectId, statusFilter, refreshKey]);

  const executeTest = async (tc, status) => {
    await api.updateTestCase(tc.id, { status, actual_result: actualResult || tc.actual_result });
    setExpandedId(null);
    setActualResult("");
    load();
  };

  return (
    <div>
      <div className="p4-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {cases.length === 0 ? (
        <div className="p4-empty">No test cases yet.</div>
      ) : (
        <table className="p4-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Created By</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((tc) => (
              <React.Fragment key={tc.id}>
                <tr onClick={() => setExpandedId(expandedId === tc.id ? null : tc.id)}>
                  <td>{tc.title}</td>
                  <td>{tc.created_by_name}</td>
                  <td>
                    <span className={`p4-badge status-${tc.status.toLowerCase()}`}>
                      {tc.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>{expandedId === tc.id ? "▲" : "▼"}</td>
                </tr>
                {expandedId === tc.id && (
                  <tr>
                    <td colSpan={4} style={{ background: "#fafbfc" }}>
                      <p><strong>Steps:</strong> {tc.steps}</p>
                      <p><strong>Expected:</strong> {tc.expected_result}</p>
                      <label>Actual result</label>
                      <textarea
                        defaultValue={tc.actual_result || ""}
                        onChange={(e) => setActualResult(e.target.value)}
                        style={{ width: "100%", minHeight: 60 }}
                      />
                      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <button className="p4-btn" onClick={() => executeTest(tc, "PASSED")}>Mark Passed</button>
                        <button className="p4-btn secondary" onClick={() => executeTest(tc, "FAILED")}>Mark Failed</button>
                        <button className="p4-btn secondary" onClick={() => executeTest(tc, "BLOCKED")}>Mark Blocked</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
