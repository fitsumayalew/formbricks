import { CheckCheckIcon, MousePointerClickIcon, PhoneIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import { TResponseDataValue } from "@formbricks/types/responses";
import {
  TSurvey,
  TSurveyMatrixQuestion,
  TSurveyMultipleChoiceQuestion,
  TSurveyPictureSelectionQuestion,
  TSurveyQuestion,
  TSurveyQuestionTypeEnum,
  TSurveyRankingQuestion as TSurveyRankingQuestionType,
  TSurveyRatingQuestion,
} from "@formbricks/types/surveys/types";
import { cn } from "@/lib/cn";
import { getLanguageCode, getLocalizedValue } from "@/lib/i18n/utils";
import { getChoiceIdByValue } from "@/lib/response/utils";
import { processResponseData } from "@/lib/responses";
import { formatDateWithOrdinal } from "@/lib/utils/datetime";
import { renderHyperlinkedContent } from "@/modules/analysis/utils";
import { ArrayResponse } from "@/modules/ui/components/array-response";
import { FileUploadResponse } from "@/modules/ui/components/file-upload-response";
import { IdBadge } from "@/modules/ui/components/id-badge";
import { PictureSelectionResponse } from "@/modules/ui/components/picture-selection-response";
import { RankingResponse } from "@/modules/ui/components/ranking-response";
import { RatingResponse } from "@/modules/ui/components/rating-response";
import { ResponseBadges } from "@/modules/ui/components/response-badges";

interface RenderResponseProps {
  responseData: TResponseDataValue;
  question: TSurveyQuestion;
  survey: TSurvey;
  language: string | null;
  isExpanded?: boolean;
  showId: boolean;
}

export const RenderResponse: React.FC<RenderResponseProps> = ({
  responseData,
  question,
  survey,
  language,
  isExpanded = true,
  showId,
}) => {
  if (
    (typeof responseData === "string" && responseData === "") ||
    (Array.isArray(responseData) && responseData.length === 0) ||
    (typeof responseData === "object" && Object.keys(responseData).length === 0)
  ) {
    return <p className="ph-no-capture my-1 font-normal text-slate-700">-</p>;
  }

  const handleArray = (data: string | number | string[]): string => {
    if (Array.isArray(data)) {
      return data.join(", ");
    } else {
      return String(data);
    }
  };
  const questionType = question.type;
  switch (questionType) {
    case TSurveyQuestionTypeEnum.Rating:
      if (typeof responseData === "number") {
        return (
          <RatingResponse
            scale={question.scale}
            answer={responseData}
            range={question.range}
            addColors={(question as TSurveyRatingQuestion).isColorCodingEnabled}
          />
        );
      }
      break;
    case TSurveyQuestionTypeEnum.Date:
      if (typeof responseData === "string") {
        const parsedDate = new Date(responseData);

        const formattedDate = isNaN(parsedDate.getTime()) ? responseData : formatDateWithOrdinal(parsedDate);

        return <p className="ph-no-capture my-1 truncate font-normal text-slate-700">{formattedDate}</p>;
      }
      break;
    case TSurveyQuestionTypeEnum.PictureSelection:
      if (Array.isArray(responseData)) {
        return (
          <PictureSelectionResponse
            choices={(question as TSurveyPictureSelectionQuestion).choices}
            selected={responseData}
            isExpanded={isExpanded}
            showId={showId}
          />
        );
      }
      break;
    case TSurveyQuestionTypeEnum.FileUpload:
      if (Array.isArray(responseData)) {
        return <FileUploadResponse selected={responseData} />;
      }
      break;
    case TSurveyQuestionTypeEnum.Matrix:
      if (typeof responseData === "object" && !Array.isArray(responseData)) {
        return (
          <>
            {(question as TSurveyMatrixQuestion).rows.map((row) => {
              const languagCode = getLanguageCode(survey.languages, language);
              const rowValueInSelectedLanguage = getLocalizedValue(row.label, languagCode);
              if (!responseData[rowValueInSelectedLanguage]) return null;
              return (
                <p key={rowValueInSelectedLanguage} className="ph-no-capture my-1 font-normal text-slate-700">
                  {rowValueInSelectedLanguage}:{processResponseData(responseData[rowValueInSelectedLanguage])}
                </p>
              );
            })}
          </>
        );
      }
      break;
    case TSurveyQuestionTypeEnum.Address:
    case TSurveyQuestionTypeEnum.ContactInfo:
      if (Array.isArray(responseData)) {
        return <ArrayResponse value={responseData} />;
      }
      break;

    case TSurveyQuestionTypeEnum.Measurement:
      if (typeof responseData === "string") {
        try {
          const parsed = JSON.parse(responseData);
          const displayValue = `${parsed.value} ${parsed.unit}`;
          return <p className="ph-no-capture my-1 font-normal text-slate-700">{displayValue}</p>;
        } catch {
          return <p className="ph-no-capture my-1 font-normal text-slate-700">{responseData}</p>;
        }
      }
      break;

    case TSurveyQuestionTypeEnum.Cal:
      if (typeof responseData === "string" || typeof responseData === "number") {
        return (
          <ResponseBadges
            items={[{ value: responseData.toString() }]}
            isExpanded={isExpanded}
            icon={<PhoneIcon className="h-4 w-4 text-slate-500" />}
            showId={showId}
          />
        );
      }
      break;
    case TSurveyQuestionTypeEnum.Consent:
      if (typeof responseData === "string" || typeof responseData === "number") {
        return (
          <ResponseBadges
            items={[{ value: responseData.toString() }]}
            isExpanded={isExpanded}
            icon={<CheckCheckIcon className="h-4 w-4 text-slate-500" />}
            showId={showId}
          />
        );
      }
      break;
    case TSurveyQuestionTypeEnum.CTA:
      if (typeof responseData === "string" || typeof responseData === "number") {
        return (
          <ResponseBadges
            items={[{ value: responseData.toString() }]}
            isExpanded={isExpanded}
            icon={<MousePointerClickIcon className="h-4 w-4 text-slate-500" />}
            showId={showId}
          />
        );
      }
      break;
    case TSurveyQuestionTypeEnum.MultipleChoiceMulti:
    case TSurveyQuestionTypeEnum.MultipleChoiceSingle:
    case TSurveyQuestionTypeEnum.Ranking: {
      const multiChoiceQuestion = question as TSurveyMultipleChoiceQuestion | TSurveyRankingQuestionType;
      const hasImages = multiChoiceQuestion.choices?.some((choice) => choice.imageUrl);

      if (typeof responseData === "string" || typeof responseData === "number") {
        const choiceId = getChoiceIdByValue(responseData.toString(), question);
        const choice = multiChoiceQuestion.choices?.find((c) => c.id === choiceId);

        if (hasImages && choice?.imageUrl) {
          return (
            <div className="my-1 flex items-center gap-2">
              <div className="relative h-10 w-16">
                <Image
                  src={choice.imageUrl}
                  alt={responseData.toString()}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-lg"
                />
              </div>
              <span className="font-medium text-slate-700">{responseData.toString()}</span>
              {choiceId && showId && <IdBadge id={choiceId} />}
            </div>
          );
        }

        return (
          <ResponseBadges
            items={[{ value: responseData.toString(), id: choiceId }]}
            isExpanded={isExpanded}
            showId={showId}
          />
        );
      } else if (Array.isArray(responseData)) {
        const itemsArray = responseData.map((choice) => {
          const choiceId = getChoiceIdByValue(choice, question);
          return { value: choice, id: choiceId };
        });

        if (questionType === TSurveyQuestionTypeEnum.Ranking) {
          if (hasImages) {
            return (
              <div className={cn("text-slate-700", isExpanded ? "space-y-2" : "flex space-x-2")}>
                {itemsArray.map(
                  (item, index) =>
                    item.value && (
                      <div key={item.value} className="flex items-center space-x-2">
                        <span className="text-slate-400">#{index + 1}</span>
                        {(() => {
                          const choice = multiChoiceQuestion.choices?.find((c) => c.id === item.id);
                          if (choice?.imageUrl) {
                            return (
                              <>
                                <div className="relative h-10 w-16">
                                  <Image
                                    src={choice.imageUrl}
                                    alt={item.value}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    className="rounded-lg"
                                  />
                                </div>
                                <span className="font-medium">{item.value}</span>
                              </>
                            );
                          }
                          return <div className="rounded bg-slate-100 px-2 py-1 font-semibold">{item.value}</div>;
                        })()}
                        {item.id && showId && <IdBadge id={item.id} />}
                      </div>
                    )
                )}
              </div>
            );
          }
          return <RankingResponse value={itemsArray} isExpanded={isExpanded} showId={showId} />;
        } else if (hasImages) {
          return (
            <div className={cn("my-1 flex gap-x-5 gap-y-4", isExpanded ? "flex-wrap" : "", showId ? "flex-col" : "")}>
              {itemsArray.map((item) => {
                const choice = multiChoiceQuestion.choices?.find((c) => c.id === item.id);
                if (choice?.imageUrl) {
                  return (
                    <div className="flex items-center gap-2" key={item.value}>
                      <div className="relative h-10 w-16">
                        <Image
                          src={choice.imageUrl}
                          alt={item.value}
                          fill
                          style={{ objectFit: "cover" }}
                          className="rounded-lg"
                        />
                      </div>
                      <span className="font-medium text-slate-700">{item.value}</span>
                      {item.id && showId && <IdBadge id={item.id} />}
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2" key={item.value}>
                    <span className="flex items-center rounded-md bg-slate-200 px-2 py-1 font-medium">
                      {item.value}
                    </span>
                    {item.id && showId && <IdBadge id={item.id} />}
                  </div>
                );
              })}
            </div>
          );
        }

        return <ResponseBadges items={itemsArray} isExpanded={isExpanded} showId={showId} />;
      }
      break;
    }

    default:
      if (
        typeof responseData === "string" ||
        typeof responseData === "number" ||
        Array.isArray(responseData)
      ) {
        return (
          <p
            className={cn(
              "ph-no-capture my-1 truncate font-normal text-slate-700",
              isExpanded ? "whitespace-pre-line" : "whitespace-nowrap"
            )}>
            {typeof responseData === "string"
              ? renderHyperlinkedContent(responseData)
              : Array.isArray(responseData)
                ? handleArray(responseData)
                : responseData}
          </p>
        );
      }
  }

  return null; // Return null if no case is matched
};
