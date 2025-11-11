import { type RefObject } from "preact";
import { useMemo, useRef, useState } from "preact/hooks";
import { useCallback, useEffect } from "react";
import { type TResponseData, type TResponseTtc } from "@formbricks/types/responses";
import type { TSurveyMeasurementQuestion, TSurveyQuestionId } from "@formbricks/types/surveys/types";
import { BackButton } from "@/components/buttons/back-button";
import { SubmitButton } from "@/components/buttons/submit-button";
import { Headline } from "@/components/general/headline";
import { QuestionMedia } from "@/components/general/question-media";
import { Subheader } from "@/components/general/subheader";
import { ScrollableContainer } from "@/components/wrappers/scrollable-container";
import { getLocalizedValue } from "@/lib/i18n";
import { getUpdatedTtc, useTtc } from "@/lib/ttc";
import { cn } from "@/lib/utils";

interface MeasurementQuestionProps {
  question: TSurveyMeasurementQuestion;
  value?: string;
  onChange: (responseData: TResponseData) => void;
  onSubmit: (data: TResponseData, ttc: TResponseTtc) => void;
  onBack: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  languageCode: string;
  ttc: TResponseTtc;
  setTtc: (ttc: TResponseTtc) => void;
  currentQuestionId: TSurveyQuestionId;
  autoFocusEnabled: boolean;
  isBackButtonHidden: boolean;
  dir?: "ltr" | "rtl" | "auto";
  fullSizeCards: boolean;
}

export function MeasurementQuestion({
  question,
  value,
  onChange,
  onSubmit,
  onBack,
  isFirstQuestion,
  isLastQuestion,
  languageCode,
  ttc,
  setTtc,
  currentQuestionId,
  autoFocusEnabled,
  isBackButtonHidden,
  dir = "auto",
  fullSizeCards,
}: Readonly<MeasurementQuestionProps>) {
  const [startTime, setStartTime] = useState(performance.now());
  const [errorMessage, setErrorMessage] = useState("");
  const isMediaAvailable = question.imageUrl || question.videoUrl;
  const isCurrent = question.id === currentQuestionId;

  // Parse the stored value: {value: "70", unit: "kg"}
  const parsedValue = useMemo(() => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return { value: "", unit: question.unit };
      }
    }
    return { value: "", unit: question.unit };
  }, [value, question.unit]);

  const [measurementValue, setMeasurementValue] = useState(parsedValue.value);
  const [selectedUnit, setSelectedUnit] = useState(parsedValue.unit || question.unit);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const getUnitOptions = useCallback(() => {
    if (question.measurementType === "height") {
      return [
        { value: "cm", label: "cm" },
        { value: "ft", label: "ft" },
        { value: "in", label: "in" },
      ];
    } else {
      return [
        { value: "kg", label: "kg" },
        { value: "lb", label: "lb" },
      ];
    }
  }, [question.measurementType]);

  useTtc(question.id, ttc, setTtc, startTime, setStartTime, isCurrent);

  useEffect(() => {
    if (isCurrent && autoFocusEnabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCurrent, autoFocusEnabled]);

  const handleMeasurementChange = useCallback(
    (newValue: string) => {
      setMeasurementValue(newValue);
      setErrorMessage("");

      const responseValue = JSON.stringify({
        value: newValue,
        unit: selectedUnit,
      });

      onChange({ [question.id]: responseValue });
    },
    [selectedUnit, onChange, question.id]
  );

  const handleUnitChange = useCallback(
    (newUnit: string) => {
      setSelectedUnit(newUnit);
      setErrorMessage("");

      const responseValue = JSON.stringify({
        value: measurementValue,
        unit: newUnit,
      });

      onChange({ [question.id]: responseValue });
    },
    [measurementValue, onChange, question.id]
  );

  const validateRange = useCallback(
    (val: string): boolean => {
      if (!question.range?.enabled) return true;

      const numValue = parseFloat(val);
      if (isNaN(numValue)) return false;

      if (question.range.min !== undefined && numValue < question.range.min) {
        setErrorMessage(`Value must be at least ${question.range.min}`);
        return false;
      }

      if (question.range.max !== undefined && numValue > question.range.max) {
        setErrorMessage(`Value must be at most ${question.range.max}`);
        return false;
      }

      return true;
    },
    [question.range]
  );

  const handleSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      const form = e.currentTarget as HTMLFormElement;

      if (form && form.checkValidity()) {
        if (question.required && (!measurementValue || measurementValue.trim() === "")) {
          setErrorMessage("This field is required");
          return;
        }

        if (measurementValue && !validateRange(measurementValue)) {
          return;
        }

        const responseValue = JSON.stringify({
          value: measurementValue,
          unit: selectedUnit,
        });

        const updatedTtcObj = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
        setTtc(updatedTtcObj);
        onSubmit({ [question.id]: responseValue }, updatedTtcObj);
      } else {
        if (!form.checkValidity()) {
          form.reportValidity();
        }
      }
    },
    [measurementValue, selectedUnit, question, validateRange, ttc, startTime, setTtc, onSubmit]
  );

  const unitOptions = getUnitOptions();

  return (
    <ScrollableContainer fullSizeCards={fullSizeCards}>
      <form key={question.id} onSubmit={handleSubmit} className="fb-w-full" ref={formRef}>
        <div>
          {isMediaAvailable ? (
            <QuestionMedia imgUrl={question.imageUrl} videoUrl={question.videoUrl} />
          ) : null}
          <Headline
            headline={getLocalizedValue(question.headline, languageCode)}
            questionId={question.id}
            required={question.required}
          />
          <Subheader
            subheader={question.subheader ? getLocalizedValue(question.subheader, languageCode) : ""}
            questionId={question.id}
          />

          <div className="fb-mt-4 fb-flex fb-gap-2 fb-items-start">
            <input
              ref={inputRef as RefObject<HTMLInputElement>}
              autoFocus={isCurrent ? autoFocusEnabled : undefined}
              tabIndex={isCurrent ? 0 : -1}
              name={`${question.id}-value`}
              id={question.id}
              placeholder="0"
              dir={dir}
              step="any"
              required={question.required}
              value={measurementValue}
              type="number"
              min={question.range?.enabled ? question.range.min : undefined}
              max={question.range?.enabled ? question.range.max : undefined}
              onInput={(e) => {
                const input = e.currentTarget;
                handleMeasurementChange(input.value);
                input.setCustomValidity("");
              }}
              className={cn(
                "fb-border-border placeholder:fb-text-placeholder fb-text-subheading focus:fb-border-brand fb-bg-input-bg fb-rounded-custom fb-flex-1 fb-border fb-p-2 fb-shadow-sm focus:fb-outline-none focus:fb-ring-0 sm:fb-text-sm",
                errorMessage ? "fb-border-red-500" : ""
              )}
            />

            <fieldset className="fb-flex-shrink-0">
              <legend className="fb-sr-only">Select unit</legend>
              <div className="fb-flex fb-gap-2">
                {unitOptions.map((option) => (
                  <label
                    key={option.value}
                    tabIndex={isCurrent ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleUnitChange(option.value);
                      }
                    }}
                    className={cn(
                      "fb-relative fb-flex fb-cursor-pointer fb-items-center fb-rounded-custom fb-border fb-px-4 fb-py-2 fb-text-sm fb-transition-all focus:fb-outline-none",
                      selectedUnit === option.value
                        ? "fb-z-10 fb-border-brand fb-bg-accent-selected-bg"
                        : "fb-border-border hover:fb-bg-accent-bg"
                    )}>
                    <input
                      tabIndex={-1}
                      type="radio"
                      name={`${question.id}-unit`}
                      value={option.value}
                      className="fb-sr-only"
                      checked={selectedUnit === option.value}
                      onChange={() => handleUnitChange(option.value)}
                    />
                    <span className="fb-font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {errorMessage && <div className="fb-text-red-500 fb-text-sm fb-mt-2">{errorMessage}</div>}
        </div>

        <div className="fb-flex fb-flex-row-reverse fb-w-full fb-justify-between fb-pt-4 fb-mt-4">
          <SubmitButton
            tabIndex={isCurrent ? 0 : -1}
            buttonLabel={getLocalizedValue(question.buttonLabel, languageCode)}
            isLastQuestion={isLastQuestion}
          />
          {!isFirstQuestion && !isBackButtonHidden && (
            <BackButton
              tabIndex={isCurrent ? 0 : -1}
              backButtonLabel={getLocalizedValue(question.backButtonLabel, languageCode)}
              onClick={() => {
                const updatedTtcObj = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
                setTtc(updatedTtcObj);
                onBack();
              }}
            />
          )}
        </div>
      </form>
    </ScrollableContainer>
  );
}
