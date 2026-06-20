import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, User, Mail, Languages, UserCheck, Eye, EyeOff, KeyRound, FileText, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const localTranslations = {
  en: {
    badgeIdLabel: "Badge ID / Officer Email",
    designationLabel: "Designation / Role",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm Password",
    fullNameLabel: "Full Name",
    signInTab: "Sign In",
    registerTab: "Register",
    badgePlaceholder: "Enter Badge ID (e.g. IO-9982)",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "Enter Full Name (e.g. Inspector Rajesh Parmar)",
    emailPlaceholder: "officer@police.gov.in or Badge ID",
    signInBtn: "Sign In",
    registerBtn: "Register System Account",
    quickDemo: "Quick Access Demo Logins",
    forgotPass: "Forgot Password?",
    systemLocked: "CrimeGPT Terminal Locked",
    systemLockedSub: "Pull the gold-tipped cord on the left lamp to power up the terminal and access the login portal.",
    loginSuccess: "Login Successful!",
    registerSuccess: "Registration Successful! Proceed to Login.",
    errorEmpty: "All fields are required.",
    errorMatch: "Passwords do not match.",
    pullCordTooltip: "PULL CORD TO POWER UP",
  },
  hi: {
    badgeIdLabel: "बैज आईडी / अधिकारी ईमेल",
    designationLabel: "पद / भूमिका",
    passwordLabel: "पासवर्ड",
    confirmPasswordLabel: "पासवर्ड की पुष्टि करें",
    fullNameLabel: "पूरा नाम",
    signInTab: "साइन इन",
    registerTab: "रजिस्टर",
    badgePlaceholder: "बैज आईडी दर्ज करें (जैसे IO-9982)",
    passwordPlaceholder: "••••••••",
    namePlaceholder: "पूरा नाम दर्ज करें (जैसे इंस्पेक्टर राजेश परमार)",
    emailPlaceholder: "officer@police.gov.in या बैज आईडी",
    signInBtn: "साइन इन करें",
    registerBtn: "सिस्टम खाता पंजीकृत करें",
    quickDemo: "त्वरित पहुंच डेमो लॉगिन",
    forgotPass: "पासवर्ड भूल गए?",
    systemLocked: "क्राइमजीपीटी टर्मिनल लॉक है",
    systemLockedSub: "टर्मिनल को चालू करने और लॉगिन पोर्टल तक पहुंचने के लिए बाईं ओर के लैंप पर सोने की नोक वाली डोरी खींचें।",
    loginSuccess: "लॉगिन सफल!",
    registerSuccess: "पंजीकरण सफल! लॉगिन करें।",
    errorEmpty: "सभी फ़ील्ड आवश्यक हैं।",
    errorMatch: "पासवर्ड मेल नहीं खाते हैं।",
    pullCordTooltip: "चालू करने के लिए डोरी खींचें",
  },
  gu: {
    badgeIdLabel: "બેજ આઈડી / અધિકારી ઇમેલ",
    designationLabel: "હોદ્દો / ભૂમિકા",
    passwordLabel: "પાસવર્ડ",
    confirmPasswordLabel: "પાસવર્ડની ખાતરી કરો",
    fullNameLabel: "પૂરું નામ",
    signInTab: "સાઇન ઇન",
    registerTab: "રજીસ્ટર",
    badgePlaceholder: "બેજ આઈડી લખો (દા.ત. IO-9982)",
    passwordPlaceholder: "પાસવર્ડ લખો",
    namePlaceholder: "પૂરું નામ લખો (દા.ત. ઇન્સ્પેક્ટર રાજેશ પરમાર)",
    emailPlaceholder: "officer@police.gov.in અથવા બેજ આઈડી",
    signInBtn: "સાઇન ઇન કરો",
    registerBtn: "સિસ્ટમ એકાઉન્ટ રજીસ્ટર કરો",
    quickDemo: "ઝડપી ડેમો લોગીન",
    forgotPass: "પાસવર્ડ ભૂલી ગયા છો?",
    systemLocked: "ક્રાઇમજીપીટી ટર્મિનલ લૉક છે",
    systemLockedSub: "ટર્મિનલ ચાલુ કરવા અને લોગિન પોર્ટલને એક્સેસ કરવા માટે ડાબી બાજુના લેમ્પ પર સોનેરી કડી વાળી દોરી ખેંચો.",
    loginSuccess: "લોગીન સફળ!",
    registerSuccess: "નોંધણી સફળ! લોગીન પ્રક્રિયા કરો.",
    errorEmpty: "બધા ફીલ્ડ્સ ફરજિયાત છે.",
    errorMatch: "પાસવર્ડ મેળ ખાતા નથી.",
    pullCordTooltip: "ચાલુ કરવા માટે દોરી ખેંચો",
  }
};

export default function LoginRegister({ onLoginSuccess, translations, lang, setLang }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('io');
  const [error, setError] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Lamp and cord states
  const [isLampOn, setIsLampOn] = useState(false);
  const [isCordPulled, setIsCordPulled] = useState(false);

  const canvasRef = useRef(null);

  const t = (translations && lang && translations[lang]) ? translations[lang] : (translations ? translations['en'] : {});
  const lt = (localTranslations && lang && localTranslations[lang]) ? localTranslations[lang] : (localTranslations ? localTranslations['en'] : {});

  // Canvas Mouse Trail & Click Firecracker Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let particles = [];

    class Particle {
      constructor(x, y, vx, vy, size, color, decay, life = 1) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.decay = decay;
        this.life = life;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.06; // gravity
        this.life -= this.decay;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.size * 5.0; // Increased blur for high-fidelity glowing light effect
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    // Spawn sparkles following the mouse (only when light is ON)
    const handleMouseMove = (e) => {
      if (!isLampOn) return;
      if (Math.random() > 0.35) return; // Reduce spawn frequency to 35% for a subtle effect
      for (let i = 0; i < 1; i++) {
        const vx = (Math.random() - 0.5) * 1.5;
        const vy = (Math.random() - 0.5) * 1.5 - 0.4;
        const size = Math.random() * 2.2 + 1.0; // Slightly smaller sparkles
        const colors = ['#fde047', '#eab308', '#fef08a', '#ca8a04', '#60a5fa', '#3b82f6'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(
          e.clientX,
          e.clientY,
          vx,
          vy,
          size,
          color,
          0.025 + Math.random() * 0.025, // Decays slightly faster
          0.8
        ));
      }
    };

    // Firecrackers burst on click (only when light is ON)
    const handleClick = (e) => {
      if (!isLampOn) return;
      const colors = [
        '#ff4757', '#ff6b81', '#2ed573', '#7bed9f', 
        '#1e90ff', '#70a1ff', '#ffa502', '#ffd32a', 
        '#ff9f43', '#ff7675', '#a29bfe', '#fd79a8',
        '#00d2d3', '#54a0ff', '#5f27cd', '#ff6b6b'
      ];
      for (let i = 0; i < 15; i++) { // Reduced count from 40 to 15
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5; // Slightly slower, more contained blast
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 1.5; // blast upward
        const size = Math.random() * 3 + 1.2; // Slightly smaller particles
        const color = colors[Math.floor(Math.random() * colors.length)];
        const decay = 0.02 + Math.random() * 0.025; // Decays faster
        particles.push(new Particle(
          e.clientX,
          e.clientY,
          vx,
          vy,
          size,
          color,
          decay,
          1.0
        ));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    const animateLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
      animationFrameId = requestAnimationFrame(animateLoop);
    };
    animateLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLampOn]);

  // Procedural mechanical pull-switch sound via Web Audio API
  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(900, audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.04);
      
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.04);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1400, audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.03);
        
        gain2.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.03);
      }, 12);
    } catch (e) {
      console.warn("AudioContext block/not supported:", e);
    }
  };

  const handleCordPull = () => {
    playClickSound();
    setIsCordPulled(true);
    setIsLampOn(prev => !prev);
    
    // Quick cord spring release animation
    setTimeout(() => {
      setIsCordPulled(false);
    }, 150);
  };

  const toggleLanguage = () => {
    setLang(prev => {
      if (prev === 'en') return 'hi';
      if (prev === 'hi') return 'gu';
      return 'en';
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!fullName || !email || !password || !confirmPassword) {
        const errMsg = lt.errorEmpty;
        setError(errMsg);
        alert(errMsg);
        return;
      }
      if (password !== confirmPassword) {
        const errMsg = lt.errorMatch;
        setError(errMsg);
        alert(errMsg);
        return;
      }

      try {
        const user = await useAuthStore.getState().register({
          username: email.split('@')[0],
          name: fullName,
          email,
          badge: `IO-${Math.floor(1000 + Math.random() * 9000)}`,
          password,
          role: role
        });
        alert(lt.registerSuccess);
        onLoginSuccess(user);
      } catch (err) {
        setError(err.message || 'Registration failed');
      }
    } else {
      if (!username || !password) {
        const errMsg = lt.errorEmpty;
        setError(errMsg);
        alert(errMsg);
        return;
      }

      try {
        const user = await useAuthStore.getState().login(username, password);
        alert(lt.loginSuccess);
        onLoginSuccess(user);
      } catch (err) {
        setError(err.message || 'Login failed');
      }
    }
  };



  // Dynamically calculate cord line positions
  const getCordPath = () => {
    if (isCordPulled) {
      return "M 76,172 L 74,275"; // Pulled state: straight down and taut
    }
    if (isLampOn) {
      return "M 76,172 L 68,252"; // ON state: slightly off-center taut cord
    }
    return "M 76,172 C 60,200 90,210 74,248"; // OFF state: wavy relaxed cord
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between items-center py-6 px-4 font-sans transition-colors duration-700 relative overflow-hidden ${
      isLampOn ? 'bg-slate-900' : 'bg-slate-950'
    }`}>

      {/* Embedded Styles for custom animations (Float and Zoom Pop) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes popIn {
          0% { transform: scale(0.82); opacity: 0; }
          70% { transform: scale(1.04); opacity: 0.95; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />

      {/* Interactive canvas layer for mouse trail and firecrackers click explosion */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />
      
      {/* Tech grid mesh background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(51,65,85,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.08)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none transition-all duration-700" 
        style={{
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, #000 60%, transparent 100%)',
          borderColor: isLampOn ? 'rgba(253, 224, 71, 0.05)' : 'transparent'
        }}
      />

      {/* Top Header Section with Language Toggle */}
      <div className="w-full max-w-6xl flex justify-end z-30">
        <button 
          onClick={toggleLanguage}
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-yellow-500/60 text-slate-200 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
        >
          <Languages className="w-4 h-4 text-yellow-500" />
          <span>{t?.langToggle || "Language"}</span>
        </button>
      </div>

      {/* Main Container Layout */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-20 my-auto">
        
        {/* LEFT COLUMN: Straight Minimalist SVG Desk Lamp with Sleeping / Happy States (Floating) */}
        <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center relative select-none animate-float">
          
          <div className="w-full max-w-[280px] h-[360px] relative overflow-visible flex items-center justify-center">
            
            {/* SVG Light Beam Projection behind the base */}
            {isLampOn && (
              <svg 
                className="absolute inset-0 w-[600px] h-[450px] pointer-events-none overflow-visible z-0 -translate-x-[50px] -translate-y-[20px] transition-opacity duration-700"
                viewBox="0 0 600 450"
              >
                <defs>
                  <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0.3">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.15" />
                    <stop offset="45%" stopColor="#fef08a" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Horizontal-ish light projection from lamp base coordinates on left towards the right card panel */}
                <polygon points="190,160 550,110 550,390 190,290" fill="url(#beamGrad)" />
              </svg>
            )}

            {/* Core Lamp SVG Structure */}
            <svg 
              viewBox="0 0 200 320" 
              className="w-full h-full overflow-visible z-10 filter drop-shadow-2xl"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* OFF shade linear gradient */}
                <linearGradient id="shadeOffGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#222428" />
                  <stop offset="60%" stopColor="#2c2f35" />
                  <stop offset="100%" stopColor="#191a1d" />
                </linearGradient>
                
                {/* ON shade linear gradient (Sage / Olive Green) */}
                <linearGradient id="shadeOnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#698b6c" />
                  <stop offset="50%" stopColor="#7fa683" />
                  <stop offset="100%" stopColor="#5d7e60" />
                </linearGradient>

                {/* Vertical Pole metal linear gradient */}
                <linearGradient id="silverPole" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="35%" stopColor="#cbd5e1" />
                  <stop offset="70%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>

                {/* 3D base top and side gradients */}
                <linearGradient id="silverBaseTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="silverBaseSide" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>

                {/* Downward light cone gradient */}
                <linearGradient id="lightBeamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.25" />
                  <stop offset="40%" stopColor="#fef08a" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                </linearGradient>

                {/* Floor glow reflection */}
                <radialGradient id="deskGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Downward light beam from green shade bottom */}
              {isLampOn && (
                <polygon 
                  points="25,170 175,170 240,320 -40,320" 
                  fill="url(#lightBeamGrad)" 
                  pointerEvents="none"
                  className="animate-pulse"
                  style={{ animationDuration: '3s' }}
                />
              )}

              {/* 3D Bevelled Disk Base */}
              {/* Bottom disk thickness shadow */}
              <ellipse cx="100" cy="296" rx="46" ry="11" fill="#475569" opacity="0.6" />
              {/* Base side body */}
              <path d="M 54,290 L 54,296 A 46,11 0 0,0 146,296 L 146,290 Z" fill="url(#silverBaseSide)" stroke="#475569" strokeWidth="0.5" />
              {/* Base flat top face */}
              <ellipse cx="100" cy="290" rx="46" ry="11" fill="url(#silverBaseTop)" stroke="#94a3b8" strokeWidth="0.5" />
              {/* Base core center connector */}
              <ellipse cx="100" cy="290" rx="12" ry="3.5" fill="#475569" />

              {/* Straight Vertical Pole Stem */}
              <rect x="94" y="165" width="12" height="125" fill="url(#silverPole)" stroke="#64748b" strokeWidth="0.5" />

              {/* Glowing floor reflection spotlight */}
              {isLampOn && (
                <ellipse cx="100" cy="300" rx="65" ry="13" fill="url(#deskGlow)" pointerEvents="none" />
              )}

              {/* Trapezoidal Shade Body */}
              <path 
                d="M 50,60 L 150,60 L 175,170 C 175,170 100,186 25,170 Z" 
                fill={isLampOn ? "url(#shadeOnGrad)" : "url(#shadeOffGrad)"} 
                stroke={isLampOn ? "#4d6a50" : "#1e2124"} 
                strokeWidth="1.5" 
                className="transition-all duration-700"
              />

              {/* Curved Inner bottom panel opening */}
              <ellipse 
                cx="100" 
                cy="170" 
                rx="75" 
                ry="12" 
                fill={isLampOn ? "#fffdec" : "#18181a"} 
                stroke={isLampOn ? "#e2e8f0" : "#27272a"} 
                strokeWidth="0.5"
                className="transition-all duration-700"
              />

              {/* Face Features: Eyes */}
              {isLampOn ? (
                // ON state: Open happy eyes
                <g className="transition-all duration-500">
                  <path d="M 64,114 Q 74,101 84,114" stroke="#0b1320" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                  <path d="M 116,114 Q 126,101 136,114" stroke="#0b1320" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                </g>
              ) : (
                // OFF state: Sleeping closed eyes
                <g className="transition-all duration-500">
                  <path d="M 64,110 Q 74,124 84,110" stroke="#121214" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M 116,110 Q 126,124 136,110" stroke="#121214" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* Face Features: Smiling Mouth (ON state only) */}
              {isLampOn && (
                <g className="transition-all duration-500 animate-fadeIn">
                  {/* Outer mouth crescent */}
                  <path 
                    d="M 84,127 Q 100,154 116,127 C 116,127 100,131 84,127 Z" 
                    fill="#0b1320" 
                  />
                  {/* Tongue overlay inside mouth */}
                  <path 
                    d="M 92,138 Q 100,129 108,138 Q 100,150 92,138 Z" 
                    fill="#ff6b6b" 
                  />
                </g>
              )}

              {/* Clickable Interactive Pull-Cord Group (Without Knob Dot) */}
              <g 
                onClick={handleCordPull}
                className="cursor-pointer group"
              >
                {/* Invisible hover helper padding zone */}
                <rect x="50" y="170" width="45" height="110" fill="transparent" />
                
                {/* Cord line string */}
                <path 
                  d={getCordPath()} 
                  stroke={isLampOn ? "#e2e8f0" : "#64748b"} 
                  strokeWidth="2.5" 
                  fill="none" 
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </g>
            </svg>

          </div>

          {/* Lamp metadata tag */}
          <div className="text-center mt-3">
            <h3 className="text-sm font-black text-slate-300 tracking-widest uppercase">CrimeGPT Terminal</h3>
            <p className="text-[10px] text-slate-500 font-extrabold uppercase mt-1 tracking-widest">
              {isLampOn ? "SYSTEM ACTIVE" : "PULL SWITCH TO TURN ON"}
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: CRIMEGPT Police Portal Login & Register Forms */}
        <div className="col-span-1 md:col-span-7 relative flex flex-col justify-center min-h-[460px]">
          
          {/* Spotlight illumination glow layer over card */}
          {isLampOn && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(254,240,138,0.06)_0%,transparent_75%)] pointer-events-none transition-opacity duration-700 z-0" />
          )}

          {/* STATE 1: OFF state locked placeholder block */}
          <div className={`absolute inset-0 flex flex-col justify-center items-center text-center p-8 transition-all duration-700 z-10 select-none ${
            isLampOn ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
          }`}>
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-full shadow-2xl mb-4 animate-bounce text-slate-500">
              <Shield className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-200 tracking-wider flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-yellow-500" /> {lt.systemLocked}
            </h3>
          </div>

          {/* STATE 2: ON state - High Fidelity portal form (Zoom Pop Animated, slightly smaller) */}
          <div className={`w-full max-w-[390px] mx-auto bg-[#13224f]/95 border-2 rounded-2xl shadow-2xl p-5 z-20 space-y-4 ${
            isLampOn 
              ? 'animate-pop-in border-yellow-500/25 shadow-yellow-500/5' 
              : 'opacity-0 scale-90 pointer-events-none border-slate-800'
          }`}>
            
            {/* Logo Badge & Branding Header */}
            <div className="text-center space-y-1.5">
              {/* Yellow Police Badge Circle */}
              <div className="w-11 h-11 rounded-full bg-[#ffd800] flex items-center justify-center mx-auto shadow-md border border-[#ca8a04]/20">
                <Shield className="w-5.5 h-5.5 text-[#0a1435] fill-current stroke-[2.5]" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-white tracking-widest">CRIMEGPT</h2>
                <p className="text-[11px] text-slate-300 font-semibold tracking-wide">
                  {isRegister ? "Police Portal Register" : "Police Portal Sign In"}
                </p>
              </div>
            </div>

            {/* Custom Yellow Sign In & Register Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-[#091129] p-1 rounded-xl border border-slate-800/80">
              <button 
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className={`py-2 rounded-lg text-xs font-black tracking-wider transition-all duration-300 ${
                  !isRegister 
                    ? 'bg-[#ffd800] text-[#0a1435] shadow-md scale-[1.02]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lt.signInTab}
              </button>
              <button 
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className={`py-2 rounded-lg text-xs font-black tracking-wider transition-all duration-300 ${
                  isRegister 
                    ? 'bg-[#ffd800] text-[#0a1435] shadow-md scale-[1.02]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lt.registerTab}
              </button>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2 px-4 rounded-xl font-bold text-center">
                {error}
              </div>
            )}

            {/* Interactive Forms */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* REGISTER FIELD: Full Name */}
              {isRegister && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                    {lt.fullNameLabel}
                  </label>
                  <div className="bg-[#080f25] border border-slate-700/80 rounded-lg focus-within:border-yellow-500/80 transition-colors flex items-center px-2.5 py-1.5">
                    <span className="text-slate-500 shrink-0"><User className="w-4.5 h-4.5" /></span>
                    <input 
                      type="text" 
                      required
                      placeholder={lt.namePlaceholder}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none ml-2.5"
                    />
                  </div>
                </div>
              )}

              {/* LOGIN/REGISTER FIELD: Badge ID / Officer Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                  {lt.badgeIdLabel}
                </label>
                <div className="bg-[#080f25] border border-slate-700/80 rounded-lg focus-within:border-yellow-500/80 transition-colors flex items-center px-2.5 py-1.5">
                  <span className="text-slate-500 shrink-0">
                    {isRegister ? <Mail className="w-4.5 h-4.5" /> : <FileText className="w-4.5 h-4.5" />}
                  </span>
                  <input 
                    type={isRegister ? "email" : "text"} 
                    required
                    placeholder={isRegister ? lt.emailPlaceholder : lt.badgePlaceholder}
                    value={isRegister ? email : username}
                    onChange={e => isRegister ? setEmail(e.target.value) : setUsername(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none ml-2.5"
                  />
                </div>
              </div>

              {/* LOGIN/REGISTER FIELD: Designation / Role Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                  {lt.designationLabel}
                </label>
                <div className="relative bg-[#080f25] border border-slate-700/80 rounded-lg focus-within:border-yellow-500/80 transition-colors flex items-center px-2.5 py-0.5">
                  <span className="text-slate-500 shrink-0"><User className="w-4.5 h-4.5" /></span>
                  <select 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-slate-100 focus:outline-none ml-2.5 py-1.5 pr-8 appearance-none cursor-pointer"
                  >
                    <option value="io" className="bg-[#091129]">Investigating Officer (IO)</option>
                    <option value="sho" className="bg-[#091129]">Station House Officer (SHO)</option>
                    <option value="legal" className="bg-[#091129]">Legal Advisor</option>
                  </select>
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* LOGIN/REGISTER FIELD: Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center pl-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    {lt.passwordLabel}
                  </label>
                  {!isRegister && (
                    <a href="#forgot" className="text-[10px] text-slate-400 hover:text-yellow-500 transition-colors font-bold uppercase tracking-wider">
                      {lt.forgotPass}
                    </a>
                  )}
                </div>
                <div className="bg-[#080f25] border border-slate-700/80 rounded-lg focus-within:border-yellow-500/80 transition-colors flex items-center px-2.5 py-1.5">
                  <span className="text-slate-500 shrink-0"><Lock className="w-4.5 h-4.5" /></span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder={lt.passwordPlaceholder}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none ml-2.5 pr-8"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-300 focus:outline-none ml-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* REGISTER FIELD: Confirm Password */}
              {isRegister && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                    {lt.confirmPasswordLabel}
                  </label>
                  <div className="bg-[#080f25] border border-slate-700/80 rounded-lg focus-within:border-yellow-500/80 transition-colors flex items-center px-2.5 py-1.5">
                    <span className="text-slate-500 shrink-0"><Lock className="w-4.5 h-4.5" /></span>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required
                      placeholder={lt.passwordPlaceholder}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none ml-2.5 pr-8"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-500 hover:text-slate-300 focus:outline-none ml-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2.5">
                <button 
                  type="submit" 
                  className="w-full bg-[#ffd800] hover:bg-[#ffe23f] text-[#0a1435] py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_25px_rgba(253,216,0,0.35)] active:scale-[0.98] cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>{isRegister ? lt.registerBtn : lt.signInBtn}</span>
                </button>
              </div>

            </form>



          </div>

        </div>

      </div>

      {/* Footer copyright */}
      <div className="text-[10px] text-slate-500 font-extrabold text-center tracking-widest z-20 px-6 uppercase mt-6">
        State Police Internal Portal Security Protocol • BNS Compliant Encryption
      </div>

    </div>
  );
}
