const fs = require('fs');

function patchFlashcard() {
  let file = fs.readFileSync('app/study/flashcard.tsx', 'utf8');
  if (!file.includes('sessionResults')) {
    file = file.replace(
      "const [strokeCount, setStrokeCount] = useState(0);",
      "const [strokeCount, setStrokeCount] = useState(0);\n  const [sessionResults, setSessionResults] = useState<any[]>([]);"
    );
    const oldHandle = `const handleRate = async (rating: number) => {
    const card = cards[currentIndex];
    await updateSRS(card.word, rating);
    
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push('/study/summary');
    }
  };`;
    const newHandle = `const handleRate = async (rating: number) => {
    const card = cards[currentIndex];
    await updateSRS(card.word, rating);
    
    const newResults = [...sessionResults, {
      word: card.word,
      correct: rating >= 3,
      pinyin: card.pinyin,
      meaning: card.meaning
    }];
    setSessionResults(newResults);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push({ pathname: '/study/summary', params: { results: JSON.stringify(newResults), mode: 'flashcard' } } as any);
    }
  };`;
    file = file.replace(oldHandle, newHandle);
    fs.writeFileSync('app/study/flashcard.tsx', file);
  }
}

function patchQuiz() {
  let file = fs.readFileSync('app/study/quiz.tsx', 'utf8');
  if (!file.includes('sessionResults')) {
    file = file.replace(
      "const [time, setTime] = useState(0);",
      "const [time, setTime] = useState(0);\n  const [sessionResults, setSessionResults] = useState<any[]>([]);"
    );
    file = file.replace(
      "setTimeout(() => advance(), 300);",
      "setTimeout(() => advance(true), 300);"
    );
    file = file.replace(
      "setTimeout(() => advance(), 600);",
      "setTimeout(() => advance(false), 600);"
    );
    const oldAdvance = `const advance = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push('/study/summary');
    }
  };`;
    const newAdvance = `const advance = (wasCorrect: boolean) => {
    const q = questions[currentIndex];
    const newResults = [...sessionResults, {
      word: q.word,
      correct: wasCorrect,
      pinyin: q.pinyin,
      meaning: q.meaning
    }];
    setSessionResults(newResults);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push({ pathname: '/study/summary', params: { results: JSON.stringify(newResults), mode: 'quiz' } } as any);
    }
  };`;
    file = file.replace(oldAdvance, newAdvance);
    fs.writeFileSync('app/study/quiz.tsx', file);
  }
}

function patchWriting() {
  let file = fs.readFileSync('app/study/writing.tsx', 'utf8');
  if (!file.includes('sessionResults')) {
    file = file.replace(
      "const [showHint, setShowHint] = useState(false);",
      "const [showHint, setShowHint] = useState(false);\n  const [sessionResults, setSessionResults] = useState<any[]>([]);"
    );
    file = file.replace(
      "advance();\n    }, 800);",
      "advance(wrongCount === 0 && hintsUsed === 0);\n    }, 800);"
    );
    file = file.replace(
      "advance();\n  };\n\n  const triggerHint",
      "advance(false);\n  };\n\n  const triggerHint"
    );
    
    // In writing.tsx, the advance function:
    const oldAdvance = `const advance = async () => {
    // Optionally record SRS based on wrong attempts
    const rating = wrongCount === 0 && hintsUsed === 0 ? 4 : (wrongCount > 2 ? 1 : 3);
    await updateSRS(questions[currentIndex].word, rating);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push('/study/summary');
    }
  };`;
    const newAdvance = `const advance = async (wasCorrect: boolean) => {
    const rating = wrongCount === 0 && hintsUsed === 0 ? 4 : (wrongCount > 2 ? 1 : 3);
    await updateSRS(questions[currentIndex].word, rating);

    const q = questions[currentIndex];
    const newResults = [...sessionResults, {
      word: q.word,
      correct: wasCorrect,
      pinyin: q.pinyin,
      meaning: q.meaning
    }];
    setSessionResults(newResults);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.push({ pathname: '/study/summary', params: { results: JSON.stringify(newResults), mode: 'writing' } } as any);
    }
  };`;
    if (file.includes(oldAdvance)) {
      file = file.replace(oldAdvance, newAdvance);
    } else {
      // maybe spacing is different, let's use regex
      file = file.replace(/const advance = async \(\) => \{[\s\S]*?router\.push\('\/study\/summary'\);\n    \}\n  \};/, newAdvance);
    }
    fs.writeFileSync('app/study/writing.tsx', file);
  }
}

patchFlashcard();
patchQuiz();
patchWriting();
