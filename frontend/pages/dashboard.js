import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Dashboard() {
  const { user, token, authHeader, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    fetchFiles();
    fetchMyRequests();
  }, [token]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/files/public`, {
        headers: authHeader(),
      });
      setFiles(res.data.files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/requests/my`, {
        headers: authHeader(),
      });
      setMyRequests(res.data.requests);
    } catch (err) {}
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/files/upload`, formData, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
      });
      setMessage('File submitted for admin review!');
      setUploadFile(null);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const requestAccess = async (file) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/requests`, {
        fileKey: file.key,
        fileName: file.name,
      }, { headers: authHeader() });
      setMessage(`Access requested for ${file.name}. Check your email once approved!`);
      fetchMyRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to request access.');
    }
  };

  const getFileStatus = (fileKey) => {
    const req = myRequests.find(r => r.fileKey === fileKey);
    return req?.status || null;
  };

  const statusColor = { pending: 'text-yellow-400', approved: 'text-green-400', denied: 'text-red-400' };

  return (
    <>
      <Head><title>Dashboard — SecureVault</title></Head>
      <div className="min-h-screen" style={{ background: '#0f0a1e' }}>
        
        {/* Navbar */}
        <div className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-400">SecureVault</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Hello, {user?.name}</span>
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border-indigo-500/30 px-4 py-3 mb-6 text-indigo-300 text-sm"
            >
              {message}
              <button onClick={() => setMessage('')} className="ml-4 text-gray-500">✕</button>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Upload Panel */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Upload a File</h2>
              <div
                className="border-2 border-dashed border-indigo-500/30 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/60 transition-colors"
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={e => setUploadFile(e.target.files[0])}
                />
                {uploadFile ? (
                  <p className="text-indigo-300 text-sm">{uploadFile.name}</p>
                ) : (
                  <>
                    <p className="text-4xl mb-2">📁</p>
                    <p className="text-gray-400 text-sm">Click to select file</p>
                    <p className="text-gray-600 text-xs mt-1">Max 50MB</p>
                  </>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="glass-button w-full py-2.5 rounded-xl text-sm font-semibold mt-4 disabled:opacity-40"
              >
                {uploading ? 'Uploading...' : 'Submit for Review'}
              </motion.button>
            </div>

            {/* Files List */}
            <div className="glass-card p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-white mb-4">
                Available Files
                <span className="ml-2 text-sm font-normal text-gray-500">({files.length})</span>
              </h2>
              {loading ? (
                <div className="text-gray-500 text-sm text-center py-8">Loading vault...</div>
              ) : files.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">No files in vault yet.</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  <AnimatePresence>
                    {files.map((file, i) => {
                      const status = getFileStatus(file.key);
                      return (
                        <motion.div
                          key={file.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors"
                        >
                          <div>
                            <p className="text-sm text-white font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB · {new Date(file.lastModified).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {status && (
                              <span className={`text-xs capitalize ${statusColor[status]}`}>{status}</span>
                            )}
                            {status !== 'pending' && status !== 'approved' && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => requestAccess(file)}
                                className="text-xs glass-button px-3 py-1.5 rounded-lg"
                              >
                                Request Access
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}