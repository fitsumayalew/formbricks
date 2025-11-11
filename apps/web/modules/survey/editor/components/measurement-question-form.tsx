"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { PlusIcon, RulerIcon, ScaleIcon } from "lucide-react";
import { JSX, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TSurvey, TSurveyMeasurementQuestion } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { createI18nString, extractLanguageCodes } from "@/lib/i18n/utils";
import { QuestionFormInput } from "@/modules/survey/components/question-form-input";
import { AdvancedOptionToggle } from "@/modules/ui/components/advanced-option-toggle";
import { Button } from "@/modules/ui/components/button";
import { Input } from "@/modules/ui/components/input";
import { Label } from "@/modules/ui/components/label";
import { OptionsSwitch } from "@/modules/ui/components/options-switch";

interface MeasurementQuestionFormProps {
  localSurvey: TSurvey;
  question: TSurveyMeasurementQuestion;
  questionIdx: number;
  updateQuestion: (questionIdx: number, updatedAttributes: Partial<TSurveyMeasurementQuestion>) => void;
  lastQuestion: boolean;
  selectedLanguageCode: string;
  setSelectedLanguageCode: (language: string) => void;
  isInvalid: boolean;
  locale: TUserLocale;
  isStorageConfigured: boolean;
  isExternalUrlsAllowed?: boolean;
}

export const MeasurementQuestionForm = ({
  question,
  questionIdx,
  updateQuestion,
  isInvalid,
  localSurvey,
  selectedLanguageCode,
  setSelectedLanguageCode,
  locale,
  isStorageConfigured = true,
  isExternalUrlsAllowed,
}: MeasurementQuestionFormProps): JSX.Element => {
  const { t } = useTranslation();
  const surveyLanguageCodes = extractLanguageCodes(localSurvey.languages ?? []);

  const measurementTypes = [
    { value: "height", label: t("common.height"), icon: <RulerIcon className="h-4 w-4" /> },
    { value: "weight", label: t("common.weight"), icon: <ScaleIcon className="h-4 w-4" /> },
  ];

  const getUnitOptions = (measurementType: "height" | "weight") => {
    if (measurementType === "height") {
      return [
        { value: "cm", label: "cm (Centimeters)", icon: <RulerIcon className="h-4 w-4" /> },
        { value: "ft", label: "ft (Feet)", icon: <RulerIcon className="h-4 w-4" /> },
        { value: "in", label: "in (Inches)", icon: <RulerIcon className="h-4 w-4" /> },
      ];
    } else {
      return [
        { value: "kg", label: "kg (Kilograms)", icon: <ScaleIcon className="h-4 w-4" /> },
        { value: "lb", label: "lb (Pounds)", icon: <ScaleIcon className="h-4 w-4" /> },
      ];
    }
  };

  const handleMeasurementTypeChange = (measurementType: "height" | "weight") => {
    const defaultUnit = measurementType === "height" ? "cm" : "kg";
    updateQuestion(questionIdx, {
      measurementType,
      unit: defaultUnit,
      range: {
        enabled: false,
        min: undefined,
        max: undefined,
      },
    });
  };

  const [parent] = useAutoAnimate();
  const [isRangeLimitEnabled, setIsRangeLimitEnabled] = useState(false);

  useEffect(() => {
    if (question?.range?.min !== undefined || question?.range?.max !== undefined) {
      setIsRangeLimitEnabled(true);
    } else {
      setIsRangeLimitEnabled(false);
    }
  }, [question?.range?.max, question?.range?.min]);

  return (
    <form>
      <QuestionFormInput
        id="headline"
        value={question.headline}
        label={t("environments.surveys.edit.question") + "*"}
        localSurvey={localSurvey}
        questionIdx={questionIdx}
        isInvalid={isInvalid}
        updateQuestion={updateQuestion}
        selectedLanguageCode={selectedLanguageCode}
        setSelectedLanguageCode={setSelectedLanguageCode}
        locale={locale}
        isStorageConfigured={isStorageConfigured}
        autoFocus={!question.headline?.default || question.headline.default.trim() === ""}
        isExternalUrlsAllowed={isExternalUrlsAllowed}
      />

      <div ref={parent}>
        {question.subheader !== undefined && (
          <div className="inline-flex w-full items-center">
            <div className="w-full">
              <QuestionFormInput
                id="subheader"
                value={question.subheader}
                label={t("common.description")}
                localSurvey={localSurvey}
                questionIdx={questionIdx}
                isInvalid={isInvalid}
                updateQuestion={updateQuestion}
                selectedLanguageCode={selectedLanguageCode}
                setSelectedLanguageCode={setSelectedLanguageCode}
                locale={locale}
                isStorageConfigured={isStorageConfigured}
                autoFocus={!question.subheader?.default || question.subheader.default.trim() === ""}
                isExternalUrlsAllowed={isExternalUrlsAllowed}
              />
            </div>
          </div>
        )}
        {question.subheader === undefined && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            type="button"
            onClick={() => {
              updateQuestion(questionIdx, {
                subheader: createI18nString("", surveyLanguageCodes),
              });
            }}>
            <PlusIcon className="mr-1 h-4 w-4" />
            {t("environments.surveys.edit.add_description")}
          </Button>
        )}
      </div>

      {/* Measurement Type Selection */}
      <div className="mt-3">
        <Label htmlFor="measurementType">{t("environments.surveys.edit.measurement_type")}</Label>
        <div className="mt-2 flex items-center">
          <OptionsSwitch
            options={measurementTypes}
            currentOption={question.measurementType}
            handleOptionChange={handleMeasurementTypeChange}
          />
        </div>
      </div>

      {/* Unit Selection */}
      <div className="mt-3">
        <Label htmlFor="unit">{t("environments.surveys.edit.unit")}</Label>
        <div className="mt-2 flex items-center">
          <OptionsSwitch
            options={getUnitOptions(question.measurementType)}
            currentOption={question.unit}
            handleOptionChange={(unit: "cm" | "ft" | "in" | "kg" | "lb") =>
              updateQuestion(questionIdx, { unit })
            }
          />
        </div>
      </div>

      {/* Range Limit */}
      <div className="mt-3">
        <AdvancedOptionToggle
          isChecked={isRangeLimitEnabled}
          onToggle={(checked: boolean) => {
            setIsRangeLimitEnabled(checked);
            updateQuestion(questionIdx, {
              range: {
                enabled: checked,
                min: undefined,
                max: undefined,
              },
            });
          }}
          htmlId="rangeLimit"
          description={t("environments.surveys.edit.range_limit_description")}
          childBorder
          title={t("environments.surveys.edit.range_limit_title")}
          customContainerClass="p-0">
          <div className="flex gap-4 p-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="minValue">{t("common.minimum")}</Label>
              <Input
                id="minValue"
                name="minValue"
                type="number"
                min={0}
                value={question?.range?.min || ""}
                aria-label={t("common.minimum")}
                className="bg-white"
                onChange={(e) =>
                  updateQuestion(questionIdx, {
                    range: {
                      ...question?.range,
                      min: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="maxValue">{t("common.maximum")}</Label>
              <Input
                id="maxValue"
                name="maxValue"
                type="number"
                min={0}
                aria-label={t("common.maximum")}
                value={question?.range?.max || ""}
                className="bg-white"
                onChange={(e) =>
                  updateQuestion(questionIdx, {
                    range: {
                      ...question?.range,
                      max: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        </AdvancedOptionToggle>
      </div>
    </form>
  );
};
