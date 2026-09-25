import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Check, X, BookOpen, Flame, GraduationCap, 
  Trophy, Star, Play, RotateCcw, ArrowRight, Sparkles, 
  TrendingUp, BadgeCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';


// Question database containing 10 questions per difficulty level
const TRIVIA_QUESTIONS = {
  easy: [
    {
      question: "Who built the ark?",
      options: ["Moses", "Noah", "Abraham", "David"],
      answer: "Noah",
      explanation: "Genesis 6:14-22. Noah built the ark out of gopher wood, exactly as God instructed, to save his family and the animals from the great flood."
    },
    {
      question: "What is the first book of the Bible?",
      options: ["Exodus", "Genesis", "Matthew", "Psalms"],
      answer: "Genesis",
      explanation: "Genesis is the book of beginnings, detailing the creation of the world, early human history, and God's covenant with Abraham."
    },
    {
      question: "Who was swallowed by a great fish?",
      options: ["Jonah", "Daniel", "Samson", "Paul"],
      answer: "Jonah",
      explanation: "Jonah 1:17. God prepared a great fish to swallow Jonah after he ran away from his mission to preach in Nineveh."
    },
    {
      question: "How many disciples did Jesus choose?",
      options: ["7", "10", "12", "40"],
      answer: "12",
      explanation: "Matthew 10:1-4. Jesus chose twelve disciples, representing the twelve tribes of Israel, to walk with Him and share His ministry."
    },
    {
      question: "What giant did David defeat with a sling and a stone?",
      options: ["Saul", "Goliath", "Absalom", "Pharaoh"],
      answer: "Goliath",
      explanation: "1 Samuel 17. Armed with only a sling, five smooth stones, and absolute faith in God, the shepherd boy David defeated the giant Goliath."
    },
    {
      question: "What did God use to make the first woman, Eve?",
      options: ["Dust", "A rib from Adam", "A flower", "Light"],
      answer: "A rib from Adam",
      explanation: "Genesis 2:22. God took one of Adam's ribs and fashioned it into the first woman, Eve, to be his partner."
    },
    {
      question: "Where was Jesus born?",
      options: ["Nazareth", "Jerusalem", "Bethlehem", "Rome"],
      answer: "Bethlehem",
      explanation: "Luke 2:4-7. Joseph and Mary traveled to Bethlehem, the city of David, where Jesus was born in a manger because there was no room in the inn."
    },
    {
      question: "What is the last book of the New Testament?",
      options: ["Jude", "Revelation", "Hebrews", "Acts"],
      answer: "Revelation",
      explanation: "The Book of Revelation, written by the Apostle John on the island of Patmos, is the final book of the Bible."
    },
    {
      question: "Who received the Ten Commandments from God on Mount Sinai?",
      options: ["Abraham", "Noah", "Moses", "Joshua"],
      answer: "Moses",
      explanation: "Exodus 19-20. Moses went up Mount Sinai, where God spoke to him and inscribed the Ten Commandments on two stone tablets."
    },
    {
      question: "Which disciple denied Jesus three times before the rooster crowed?",
      options: ["Judas", "Thomas", "John", "Peter"],
      answer: "Peter",
      explanation: "Matthew 26:75. Just as Jesus predicted, Peter denied knowing Him three times out of fear, and wept bitterly when the rooster crowed."
    }
  ],
  hard: [
    {
      question: "Which king of Israel asked God for wisdom instead of wealth or long life?",
      options: ["David", "Saul", "Solomon", "Hezekiah"],
      answer: "Solomon",
      explanation: "1 Kings 3. Pleased that Solomon did not ask for selfish gains, God gave him unmatched wisdom, as well as riches and honor."
    },
    {
      question: "Who was the first Christian martyr?",
      options: ["Stephen", "Peter", "Paul", "James"],
      answer: "Stephen",
      explanation: "Acts 7:54-60. Stephen, full of grace and power, was stoned to death for testifying to the glory of Jesus, praying for his executors as he died."
    },
    {
      question: "What was the name of Abraham's second wife, whom he married after Sarah's death?",
      options: ["Hagar", "Keturah", "Rebekah", "Leah"],
      answer: "Keturah",
      explanation: "Genesis 25:1. After Sarah passed away, Abraham married Keturah, who bore him six sons."
    },
    {
      question: "How many years did the Israelites wander in the wilderness?",
      options: ["7 years", "12 years", "40 years", "70 years"],
      answer: "40 years",
      explanation: "Numbers 14:34. Due to their rebellion and lack of faith in entering the Promised Land, they were sentenced to wander forty years."
    },
    {
      question: "What was the name of the place where Jesus was crucified?",
      options: ["Gethsemane", "Golgotha", "Capernaum", "Bethlehem"],
      answer: "Golgotha",
      explanation: "John 19:17. Golgotha (Aramaic for 'The Place of the Skull') is the hill outside Jerusalem's walls where Christ was crucified."
    },
    {
      question: "What did John the Baptist eat in the wilderness?",
      options: ["Bread and fish", "Wild berries and honey", "Locusts and wild honey", "Grapes and figs"],
      answer: "Locusts and wild honey",
      explanation: "Matthew 3:4. John the Baptist wore clothes made of camel's hair and survived on locusts and wild honey."
    },
    {
      question: "Which city's walls fell down after the Israelites marched around it for seven days?",
      options: ["Babylon", "Nineveh", "Jericho", "Sodom"],
      answer: "Jericho",
      explanation: "Joshua 6. Led by Joshua, the Israelites marched around Jericho's walls once daily for six days, and seven times on the seventh day, causing the walls to collapse."
    },
    {
      question: "Who was the oldest man mentioned in the Bible, living to be 969 years old?",
      options: ["Jared", "Methuselah", "Enoch", "Noah"],
      answer: "Methuselah",
      explanation: "Genesis 5:27. Methuselah, the grandfather of Noah, lived for 969 years before he died, making him the longest-lived human in Scripture."
    },
    {
      question: "On what day of Creation did God make the sun, moon, and stars?",
      options: ["First Day", "Third Day", "Fourth Day", "Fifth Day"],
      answer: "Fourth Day",
      explanation: "Genesis 1:14-19. God created the lights in the dome of the sky to separate day from night and mark seasons on the fourth day."
    },
    {
      question: "Who was Moses' spokesperson and brother?",
      options: ["Aaron", "Joshua", "Caleb", "Hur"],
      answer: "Aaron",
      explanation: "Exodus 4:14-16. Since Moses was hesitant about his speaking ability, God appointed his brother Aaron to be his spokesperson."
    }
  ],
  expert: [
    {
      question: "Who was the left-handed judge who assassinated King Eglon of Moab?",
      options: ["Ehud", "Gideon", "Othniel", "Samson"],
      answer: "Ehud",
      explanation: "Judges 3. Ehud crafted a double-edged sword, bound it to his right thigh, gained a private audience with the obese King Eglon, and assassinated him."
    },
    {
      question: "In the Book of Revelation, what is the name of the star that fell into the waters, making them bitter?",
      options: ["Absinthe", "Wormwood", "Marah", "Lucifer"],
      answer: "Wormwood",
      explanation: "Revelation 8:11. The star is called Wormwood. A third of the waters became bitter as wormwood, and many died from the bitter water."
    },
    {
      question: "Which of these is NOT one of the daughters of Job born after his restoration?",
      options: ["Jemimah", "Keziah", "Keren-Happuch", "Milcah"],
      answer: "Milcah",
      explanation: "Job 42:14. Job's three daughters after his trials were Jemimah, Keziah, and Keren-Happuch. Milcah was Abraham's sister-in-law."
    },
    {
      question: "What was the name of the high priest of Midian, who was Moses' father-in-law?",
      options: ["Jethro", "Aaron", "Melchizedek", "Balaam"],
      answer: "Jethro",
      explanation: "Exodus 3:1. Jethro (also called Reuel) was the priest of Midian whose daughter Zipporah Moses married after fleeing Egypt."
    },
    {
      question: "What was the name of the apostle who replaced Judas Iscariot?",
      options: ["Barnabas", "Matthias", "Silas", "Stephen"],
      answer: "Matthias",
      explanation: "Acts 1:26. Two candidates were put forward, and after praying and casting lots, the lot fell on Matthias to replace Judas."
    },
    {
      question: "Which book of the Bible mentions the mythological creatures Behemoth and Leviathan?",
      options: ["Job", "Daniel", "Ezekiel", "Revelation"],
      answer: "Job",
      explanation: "Job 40-41. God describes the strength of the Behemoth and the fierce power of the Leviathan to remind Job of human limitation compared to the Creator."
    },
    {
      question: "What was the name of the queen who tried to kill the prophet Elijah?",
      options: ["Jezebel", "Esther", "Athaliah", "Sheba"],
      answer: "Jezebel",
      explanation: "1 Kings 19:1-2. After Elijah defeated the prophets of Baal on Mount Carmel, Queen Jezebel sent a messenger threatening to take his life."
    },
    {
      question: "How many chapters are in the Book of Isaiah?",
      options: ["40", "50", "66", "150"],
      answer: "66",
      explanation: "The Book of Isaiah has exactly 66 chapters, which matches the total number of books in the modern biblical canon (39 Old, 27 New)."
    },
    {
      question: "Who was the father of the prophet Samuel?",
      options: ["Elkanah", "Eli", "Jesse", "Kish"],
      answer: "Elkanah",
      explanation: "1 Samuel 1:1-2. Elkanah of Ramathaim-zophim was Samuel's father, and Hannah, who prayed desperately for a child, was his mother."
    },
    {
      question: "Which king of Judah was struck with leprosy for trying to burn incense in the temple?",
      options: ["Uzziah", "Hezekiah", "Josiah", "Ahab"],
      answer: "Uzziah",
      explanation: "2 Chronicles 26:16-21. Uzziah's pride led him to enter the Temple to burn incense—a duty reserved only for priests. Leprosy broke out on his forehead immediately."
    }
  ]
};

const DIFFICULTY_CONFIGS = {
  easy: {
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    pointVal: 10,
    icon: Flame,
    title: 'Easy'
  },
  hard: {
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    pointVal: 20,
    icon: BookOpen,
    title: 'Hard'
  },
  expert: {
    color: 'from-rose-500 to-purple-600',
    borderColor: 'border-rose-500/20',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    pointVal: 30,
    icon: GraduationCap,
    title: 'Expert'
  }
};

export default function Trivia() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('play'); // 'play' | 'leaderboard' | 'stats'
  
  // Quiz State
  const [gameState, setGameState] = useState('select'); // 'select' | 'playing' | 'summary'
  const [difficulty, setDifficulty] = useState('easy');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await api.get('/api/trivia/leaderboard');
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      toast.error("Failed to load community leaderboard");
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  // Start a new trivia session
  const startTrivia = async (selectedDiff) => {
    setDifficulty(selectedDiff);
    setIsLoadingQuestions(true);
    try {
      const res = await api.get('/api/trivia/questions?difficulty=${selectedDiff}');
      if (res.data && res.data.questions && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
      } else {
        // Fallback to local subset
        const pool = TRIVIA_QUESTIONS[selectedDiff];
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching trivia questions from server:", err);
      // Fallback
      const pool = TRIVIA_QUESTIONS[selectedDiff];
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, 5));
    } finally {
      setIsLoadingQuestions(false);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setCorrectCount(0);
      setEarnedPoints(0);
      setGameState('playing');
    }
  };

  // Handle option click
  const handleOptionClick = (option) => {
    if (hasAnswered) return;
    setSelectedAnswer(option);
    setHasAnswered(true);

    const isCorrect = option === questions[currentIndex].answer;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      const pointsPerQ = DIFFICULTY_CONFIGS[difficulty].pointVal;
      setEarnedPoints(prev => prev + pointsPerQ);
    }
  };

  // Move to next question or complete
  const handleNext = async () => {
    if (currentIndex < 4) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      // Quiz Complete - submit to backend
      setGameState('summary');
      try {
        const res = await api.post('/api/trivia/submit', {
          points: earnedPoints,
          difficulty,
          correctCount,
          totalQuestions: 5
        });

        // Update local auth context user
        if (res.data.user) {
          setUser(res.data.user);
        }
        toast.success(`Grace received! You earned +${earnedPoints} Bible Scholar points.`);
      } catch (err) {
        console.error("Failed to submit score", err);
        toast.error("Could not upload your score, but your offline result is secure!");
      }
    }
  };

  // Stats calculation
  const points = user?.trivia_points || 0;
  const stats = user?.trivia_stats || {
    easyCompleted: 0,
    hardCompleted: 0,
    expertCompleted: 0,
    totalCorrect: 0,
    totalAttempted: 0
  };
  const accuracy = stats.totalAttempted > 0 
    ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-white min-h-[calc(100vh-100px)]">
      {/* Title Header banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent p-6 md:p-8 rounded-3xl border border-white/[0.04] shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <BookOpen size={240} className="text-amber-400 rotate-12" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-400/20">
              Scripture Training
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-400/80 font-bold bg-white/5 px-2 py-0.5 rounded-full">
              <Trophy size={11} /> {points} Pts
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Bible <span className="text-amber-400 font-extrabold">Trivia</span> Challenge</h1>
          <p className="text-sm text-slate-400 max-w-lg">
            Grow in scriptural wisdom, earn honor points, and demonstrate theological mastery alongside other community believers.
          </p>
        </div>

        {/* Level Indicator */}
        <div className="relative z-10 flex items-center gap-3 bg-slate-950/40 border border-white/[0.05] p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">
            {points >= 300 ? <GraduationCap size={22} /> : points >= 100 ? <BookOpen size={22} /> : <Flame size={22} />}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Current Rank</span>
            <span className="text-sm font-extrabold text-white">
              {points >= 300 ? 'Theology Scholar' : points >= 150 ? 'Bible Teacher' : points >= 50 ? 'Spiritual Disciple' : 'Faith Seeker'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-white/[0.05] mb-6 gap-2">
        {[
          { id: 'play', label: 'Play Trivia', icon: Play },
          { id: 'leaderboard', label: 'BFF Leaderboard', icon: Trophy },
          { id: 'stats', label: 'My Growth Stats', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-bold transition-all duration-200 ${
              activeTab === tab.id 
                ? 'border-amber-400 text-amber-400 bg-amber-400/5 rounded-t-xl' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Play Tab content */}
      {activeTab === 'play' && (
        <div>
          {isLoadingQuestions && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-amber-400/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-300 font-bold text-lg animate-pulse">Gathering Scripture Questions...</p>
              <p className="text-xs text-slate-500 mt-2 max-w-xs">Connecting to the live Bible trivia database for fresh scripture challenges.</p>
            </div>
          )}

          {!isLoadingQuestions && gameState === 'select' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center py-6">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Choose Your Scripture Tier</span>
                <h2 className="text-xl font-bold text-white">Test Your Knowledge of God's Word</h2>
              </div>

              {/* Tier Cards Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(DIFFICULTY_CONFIGS).map(([diffKey, config]) => {
                  const DiffIcon = config.icon;
                  return (
                    <div 
                      key={diffKey}
                      className={`relative overflow-hidden rounded-3xl bg-slate-900 border ${config.borderColor} p-6 flex flex-col justify-between h-72 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 group`}
                    >
                      {/* Accent glow on hover */}
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${config.color} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity duration-300`} />
                      
                      <div className="space-y-4">
                        <div className={`w-12 h-12 rounded-2xl ${config.bgColor} flex items-center justify-center ${config.textColor}`}>
                          <DiffIcon size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5 capitalize">
                            {config.title}
                          </h3>
                          <span className={`text-xs font-bold ${config.textColor}`}>
                            +{config.pointVal} Points / correct answer
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {diffKey === 'easy' && "Perfect for new believers. General Bible history, primary stories, and prominent figures."}
                          {diffKey === 'hard' && "Dive deeper into covenants, theological history, martyrs, prophetic books, and chronology."}
                          {diffKey === 'expert' && "Intended for theology students & study group leaders. Detailed verse citations, rare historical acts, and canonical details."}
                        </p>
                      </div>

                      <button
                        onClick={() => startTrivia(diffKey)}
                        className={`w-full mt-4 py-3 rounded-xl bg-gradient-to-r ${config.color} text-slate-900 font-extrabold text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-200 shadow-md flex items-center justify-center gap-1`}
                      >
                        <Play size={12} fill="currentColor" />
                        <span>Begin Quest</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Safe Guidelines Banner */}
              <div className="bg-[#1E293B] p-5 rounded-2xl border border-white/[0.04] flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-slate-200 block">Why points matter?</span>
                  <span>Every quiz round awards points to your community profile. Gain badges, climb our community leaderboard, and inspire other believers to study the scriptures daily.</span>
                </div>
              </div>
            </motion.div>
          )}

          {!isLoadingQuestions && gameState === 'playing' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/60 rounded-3xl border border-white/[0.04] p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Diff Indicator */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${DIFFICULTY_CONFIGS[difficulty].color}`} />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {difficulty} Level
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/10">
                  Round Progress: {currentIndex + 1} / 5
                </span>
              </div>

              {/* Progress Line */}
              <div className="h-1 bg-slate-950 rounded-full mb-8 overflow-hidden">
                <motion.div 
                  className={`h-full bg-gradient-to-r ${DIFFICULTY_CONFIGS[difficulty].color}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Active Question Box */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg md:text-xl font-bold leading-snug">
                    {questions[currentIndex]?.question}
                  </h2>

                  {/* Options List */}
                  <div className="grid gap-3.5 mt-6">
                    {questions[currentIndex]?.options.map((option, idx) => {
                      const isCorrectAnswer = option === questions[currentIndex].answer;
                      const isSelectedAnswer = option === selectedAnswer;
                      
                      let optionStyle = "bg-slate-950/40 border-white/[0.04] text-slate-300 hover:bg-slate-950/75 hover:border-white/[0.1]";
                      
                      if (hasAnswered) {
                        if (isCorrectAnswer) {
                          optionStyle = "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-extrabold";
                        } else if (isSelectedAnswer) {
                          optionStyle = "bg-rose-500/15 border-rose-500/30 text-rose-300 font-extrabold";
                        } else {
                          optionStyle = "bg-slate-950/20 border-transparent text-slate-500 pointer-events-none opacity-50";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(option)}
                          disabled={hasAnswered}
                          className={`w-full p-4 rounded-2xl border text-left text-sm transition-all duration-200 flex items-center justify-between ${optionStyle}`}
                        >
                          <span>{option}</span>
                          {hasAnswered && (
                            <span>
                              {isCorrectAnswer && <Check size={16} className="text-emerald-400 stroke-[3]" />}
                              {isSelectedAnswer && !isCorrectAnswer && <X size={16} className="text-rose-400 stroke-[3]" />}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation Block */}
                  {hasAnswered && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-[#1E293B] border border-white/[0.04] space-y-2 mt-6"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-amber-400" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-amber-400">Scriptural Explanation</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {questions[currentIndex]?.explanation}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Action */}
              <div className="flex justify-end mt-8">
                {hasAnswered ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs uppercase tracking-widest shadow-md transition-all duration-200"
                  >
                    <span>{currentIndex < 4 ? 'Next Question' : 'View Summary'}</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <span className="text-xs text-[#475569] font-medium italic">Select your answer to proceed</span>
                )}
              </div>
            </motion.div>
          )}

          {!isLoadingQuestions && gameState === 'summary' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 rounded-3xl border border-white/[0.04] p-8 shadow-2xl text-center space-y-6 max-w-xl mx-auto relative overflow-hidden"
            >
              {/* Sparkles effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/5 blur-3xl rounded-full" />
              
              <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400 mx-auto">
                <Trophy size={36} />
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">
                  Quest Complete
                </span>
                <h2 className="text-2xl font-extrabold">Well Done, Faith Scholar!</h2>
                <p className="text-xs text-slate-400 mt-1">You've completed the {difficulty} Bible trivia tier.</p>
              </div>

              {/* Statistics grid */}
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto py-2">
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/[0.02]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Correct</span>
                  <span className="text-xl font-extrabold text-emerald-400">{correctCount} / 5</span>
                </div>
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/[0.02]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Points Gained</span>
                  <span className="text-xl font-extrabold text-amber-400">+{earnedPoints} Pts</span>
                </div>
              </div>

              <div className="text-xs text-[#64748B] leading-relaxed max-w-sm mx-auto">
                {correctCount === 5 && "Flawless score! Your understanding of biblical texts is truly remarkable. Glory be to God!"}
                {correctCount >= 3 && correctCount < 5 && "Great study session! Keep meditating on the scriptures daily to hone your understanding."}
                {correctCount < 3 && "A great opportunity to open the Word of God and read. Regular Bible reading yields boundless wisdom!"}
              </div>

              <div className="flex gap-3 justify-center pt-4">
                <button
                  onClick={() => setGameState('select')}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.05] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200"
                >
                  <RotateCcw size={14} />
                  <span>Choose Another Tier</span>
                </button>
                <button
                  onClick={() => startTrivia(difficulty)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all duration-200"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Retry Same Tier</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Leaderboard Tab content */}
      {activeTab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center mb-1">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                Community Scholars
              </h2>
              <p className="text-xs text-slate-400">Believers leading the community in scriptural learning and dedication.</p>
            </div>
            <button 
              onClick={fetchLeaderboard}
              disabled={isLoadingLeaderboard}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
            >
              <RotateCcw size={12} className={isLoadingLeaderboard ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingLeaderboard ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" aria-label="Loading" />
              <p className="text-xs text-slate-400 font-bold">Querying the Temple registers...</p>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-3xl border border-white/[0.04] overflow-hidden shadow-2xl">
              <div className="divide-y divide-white/[0.04]">
                {leaderboard.map((item, idx) => {
                  const isCurrentUser = item._id === user?._id;
                  const rank = idx + 1;
                  
                  return (
                    <div 
                      key={item._id}
                      className={`flex items-center justify-between p-4 transition-colors duration-200 ${
                        isCurrentUser ? 'bg-amber-500/[0.06] border-l-4 border-amber-400' : 'hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className="w-7 h-7 flex items-center justify-center font-black text-xs">
                          {rank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-900 flex items-center justify-center text-xs shadow-md">🥇</span>
                          ) : rank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-900 flex items-center justify-center text-xs shadow-md">🥈</span>
                          ) : rank === 3 ? (
                            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-amber-800 text-white flex items-center justify-center text-xs shadow-md">🥉</span>
                          ) : (
                            <span className="text-slate-400">#{rank}</span>
                          )}
                        </div>

                        {/* Profile Photo */}
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                          <img src={item.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'} alt={item.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Profile Name & Tag */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${isCurrentUser ? 'text-amber-400' : 'text-white'}`}>
                              {item.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[8px] uppercase font-black bg-amber-400/20 text-amber-300 px-1 py-0.5 rounded border border-amber-400/10">
                                You
                              </span>
                            )}
                            {item.is_verified && <BadgeCheck size={12} className="text-blue-400" />}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            @{item.username} · {item.denomination}
                          </span>
                        </div>
                      </div>

                      {/* Score Value */}
                      <div className="text-right space-y-0.5">
                        <span className="text-xs font-black text-amber-400 block">
                          {item.trivia_points || 0} Pts
                        </span>
                        <span className="text-[9px] text-[#64748B] block">
                          Accuracy: {item.trivia_stats ? Math.round((item.trivia_stats.totalCorrect / Math.max(1, item.trivia_stats.totalAttempted)) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Stats Tab content */}
      {activeTab === 'stats' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1">Total Score Gained</span>
              <span className="text-2xl font-black text-amber-400">{points} Pts</span>
              <span className="text-[10px] text-slate-500 block mt-2">Earned across all quiz attempts</span>
            </div>
            
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1">Accuracy Rating</span>
              <span className="text-2xl font-black text-emerald-400">{accuracy}%</span>
              <span className="text-[10px] text-slate-500 block mt-2">
                {stats.totalCorrect} / {stats.totalAttempted} correct answers
              </span>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block mb-1">Rank Achievement</span>
              <span className="text-xl font-extrabold text-purple-400">
                {points >= 300 ? 'Theology Scholar' : points >= 150 ? 'Bible Teacher' : points >= 50 ? 'Spiritual Disciple' : 'Faith Seeker'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-3">Next rank: {points < 50 ? 'Spiritual Disciple (50 Pts)' : points < 150 ? 'Bible Teacher (150 Pts)' : points < 300 ? 'Theology Scholar (300 Pts)' : 'Ultimate Canonicate'}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-3xl border border-white/[0.04] p-6 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Completion Log</h3>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Flame size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Easy Tier Rounds</span>
                    <span className="text-[9px] text-[#64748B]">10 Points per answer</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-white">{stats.easyCompleted || 0} Quizzes</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Hard Tier Rounds</span>
                    <span className="text-[9px] text-[#64748B]">20 Points per answer</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-white">{stats.hardCompleted || 0} Quizzes</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Expert Tier Rounds</span>
                    <span className="text-[9px] text-[#64748B]">30 Points per answer</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-white">{stats.expertCompleted || 0} Quizzes</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
