import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { questions } from "../onboarding/questions";
import { resolveTier } from "../onboarding/scoring";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const currentQuestion = questions[step];

  const handleAnswer = async (option: any) => {
    if (saving) return;

    const updatedAnswers = [...answers, option.id];
    setAnswers(updatedAnswers);

    if (step + 1 < questions.length) {
      setStep(step + 1);
      return;
    }

    const result = resolveTier(updatedAnswers);

    if (!user) {
  console.error("No authenticated user found");
  return;
}

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          vibe: result,
        })
        .eq("id", user.id);

      if (error) throw error;

      navigate("/profile/edit");
    } catch (error) {
      console.error("Failed to save vibe:", error);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="mb-6 h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>

        <h1 className="text-2xl font-bold mb-8 text-center">
          {currentQuestion.question}
        </h1>

        {saving && (
          <div className="text-center text-sm text-white/60 mb-4">
            Saving your vibe...
          </div>
        )}

        <div className="space-y-4">
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option)}
              disabled={saving}
              className="w-full p-4 border border-white/20 rounded-xl hover:bg-white hover:text-black transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option.text}
            </button>
          ))}
        </div>

        <div className="mt-6 text-sm text-white/40 text-center">
          {step + 1} / {questions.length}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;