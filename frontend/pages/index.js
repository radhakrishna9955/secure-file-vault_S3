import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const VaultOrb = dynamic(() => import('../components/VaultOrb'), { ssr: false });

export default function Home() {
  const router = useRouter();
  
  return (
    <>
      <Head>
        <title>SecureVault — Encrypted Cloud File Management</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
           style={{ background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f0a1e 70%)' }}>
        
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-indigo-500 rounded-full opacity-30"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [-20, 20, -20], opacity: [0.1, 0.5, 0.1] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>
        
        {/* 3D Vault Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <VaultOrb />
        </motion.div>
        
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center px-6 -mt-8 z-10"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            SecureVault
          </h1>
          <p className="text-xl text-indigo-200 mb-2">Enterprise-grade encrypted file management</p>
          <p className="text-gray-400 mb-10 max-w-md mx-auto">
            Files protected by AWS S3 presigned URLs. Admin-approved access. Zero public exposure.
          </p>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/login')}
              className="glass-button px-8 py-3 rounded-xl font-semibold text-white"
            >
              Sign In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/register')}
              className="px-8 py-3 rounded-xl font-semibold border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 transition-all"
            >
              Register
            </motion.button>
          </div>
        </motion.div>
        
        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-3 mt-10 flex-wrap justify-center px-6"
        >
          {['S3 Presigned URLs', 'OAuth Login', 'Admin Approval', '3D Encrypted Vault', 'SES Notifications'].map(f => (
            <span key={f} className="glass-card px-4 py-1.5 text-sm text-indigo-300 border border-indigo-500/20">
              {f}
            </span>
          ))}
        </motion.div>
      </div>
    </>
  );
}