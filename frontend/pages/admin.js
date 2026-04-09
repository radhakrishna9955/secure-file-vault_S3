import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminDashboard() {
  const { user, token, authHeader, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState('requests');
  const router = useRouter();

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    if (user?.role !== 'admin') { router.push('/dashboard'); return; }
    fetchData();
  }, [token, user]);

  const fetchData = async () => {
    try {
      const [reqRes, statsRes, pendingRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/requests/all`, { headers: authHeader() }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, { headers: authHeader() }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/files/pending`, { headers: authHeader() }),
      ]);
      setRequests(reqRes.data.requests);
      setStats(statsRes.data);
      setPendingFiles(pendingRes.data.files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setProcessing(requestId);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/approve/${requestId}`, {}, {
        headers: authHeader(),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (requestId) => {
    setProcessing(requestId);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/deny/${requestId}`, {}, {
        headers: authHeader(),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = {
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
    denied: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  return (
    <>
      <Head><title>Admin — SecureVault</title></Head>
      <div className="min-h-screen" style={{ background: '#0f0a1e' }}>
        
        <div className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-indigo-400">SecureVault</h1>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Requests', value: stats.total || 0, color: 'text-indigo-400' },
              { label: 'Pending', value: stats.pending || 0, color: 'text-yellow-400' },
              { label: 'Approved', value: stats.approved || 0, color: 'text-green-400' },
              { label: 'Denied', value: stats.denied || 0, color: 'text-red-400' },
            ].map(stat => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            {['requests', 'pending_files'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'glass-button text-white'
                    : 'text-gray-400 hover:text-gray-300 border border-white/10 hover:bg-white/5'
                }`}
              >
                {tab === 'requests' ? 'Access Requests' : 'Pending Files'}
              </button>
            ))}
          </div>

          {/* Requests table */}
          {activeTab === 'requests' && (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Access Requests</h2>
              </div>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No requests yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  <AnimatePresence>
                    {requests.map((req, i) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="px-6 py-4 flex items-center justify-between hover:bg-white/5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">{req.fileName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {req.userName} · {req.userEmail} · {new Date(req.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusBadge[req.status]}`}>
                            {req.status}
                          </span>
                          {req.status === 'pending' && (
                            <>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApprove(req.id)}
                                disabled={processing === req.id}
                                className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                              >
                                {processing === req.id ? '...' : 'Approve'}
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeny(req.id)}
                                disabled={processing === req.id}
                                className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                              >
                                Deny
                              </motion.button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Pending files */}
          {activeTab === 'pending_files' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">User-Submitted Files (Pending Review)</h2>
              {pendingFiles.length === 0 ? (
                <p className="text-gray-500 text-sm">No files awaiting review.</p>
              ) : (
                <div className="space-y-3">
                  {pendingFiles.map(file => (
                    <div key={file.key} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm text-white">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <span className="text-xs text-yellow-400">Awaiting review</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}