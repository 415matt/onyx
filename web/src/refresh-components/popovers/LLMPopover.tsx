import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getDisplayNameForModel, LlmDescriptor, LlmManager } from "@/lib/hooks";
import { LLMProviderDescriptor } from "@/app/admin/configuration/llm/interfaces";
import { modelSupportsImageInput, structureValue } from "@/lib/llm/utils";
import { getProviderIcon } from "@/app/admin/configuration/llm/utils";
import { IconProps } from "@/components/icons/icons";
import { Slider } from "@/components/ui/slider";
import { useUser } from "@/components/user/UserProvider";
import { useChatContext } from "@/refresh-components/contexts/ChatContext";
import { SettingsContext } from "@/components/settings/SettingsProvider"; // UCSD Patch
import SelectButton from "@/refresh-components/buttons/SelectButton";
import LineItem from "@/refresh-components/buttons/LineItem";
import Text from "@/refresh-components/texts/Text";
import SimpleLoader from "@/refresh-components/loaders/SimpleLoader";
import {
  buildPlausibleClasses,
  sanitizeForPlausible,
} from "@/lib/analytics/plausible";
export interface LLMPopoverProps {
  llmManager: LlmManager;
  requiresImageGeneration?: boolean;
  folded?: boolean;
  onSelect?: (value: string) => void;
  currentModelName?: string;
  disabled?: boolean;
  icon?: (props: IconProps) => React.ReactElement;
}

export default function LLMPopover({
  llmManager,
  requiresImageGeneration,
  folded,
  onSelect,
  currentModelName,
  disabled = false,
  icon,
}: LLMPopoverProps) {
  const { llmProviders } = useChatContext();
  const isLoadingProviders = llmManager.isLoadingProviders;
  // UCSD Patch
  const settings = useContext(SettingsContext);
  // End UCSD Patch

  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const [localTemperature, setLocalTemperature] = useState(
    llmManager.temperature ?? 0.5
  );

  useEffect(() => {
    setLocalTemperature(llmManager.temperature ?? 0.5);
  }, [llmManager.temperature]);

  // Use useCallback to prevent function recreation
  const handleTemperatureChange = useCallback((value: number[]) => {
    const value_0 = value[0];
    if (value_0 !== undefined) {
      setLocalTemperature(value_0);
    }
  }, []);

  const handleTemperatureChangeComplete = useCallback(
    (value: number[]) => {
      const value_0 = value[0];
      if (value_0 !== undefined) {
        llmManager.updateTemperature(value_0);
      }
    },
    [llmManager]
  );

  // UCSD Patch
  type ModelOption = {
    name: string;
    provider: string;
    modelName: string;
    icon: ({
      size,
      className,
    }: {
      size: number;
      className?: string;
    }) => React.ReactElement;
    section?: "local" | "cloud";
  };

  const llmOptionsToChooseFrom = useMemo(() => {
    if (!llmProviders) {
      return [];
    }

    const allModels: ModelOption[] = llmProviders.flatMap((llmProvider) =>
      llmProvider.model_configurations
        .filter(
          (modelConfiguration) =>
            modelConfiguration.is_visible ||
            modelConfiguration.name === currentModelName
        )
        .map((modelConfiguration) => ({
          name: llmProvider.name,
          provider: llmProvider.provider,
          modelName: modelConfiguration.name,
          icon: getProviderIcon(llmProvider.provider, modelConfiguration.name),
        }))
    );

    // If grouping is disabled, return models as-is
    if (!settings?.settings?.group_local_models) {
      return allModels;
    }

    // Separate local (hosted_vllm) and cloud models
    const localModels = allModels.filter((m) => m.provider === "hosted_vllm");
    const cloudModels = allModels.filter((m) => m.provider !== "hosted_vllm");

    // Sort each group by provider then model name
    const sortModels = (models: ModelOption[]) => {
      return models.sort((a, b) => {
        // First sort by provider
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider);
        }
        // Then by model name
        return getDisplayNameForModel(a.modelName).localeCompare(
          getDisplayNameForModel(b.modelName)
        );
      });
    };

    const sortedLocalModels = sortModels(localModels);
    const sortedCloudModels = sortModels(cloudModels);

    // Return grouped models with section markers
    return [
      ...sortedLocalModels.map((m) => ({ ...m, section: "local" as const })),
      ...sortedCloudModels.map((m) => ({ ...m, section: "cloud" as const })),
    ];
  }, [llmProviders, currentModelName, settings?.settings?.group_local_models]);
  // End UCSD Patch

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div data-testid="llm-popover-trigger">
          <SelectButton
            leftIcon={({ className }) => {
              const IconComponent =
                icon ||
                getProviderIcon(
                  llmManager.currentLlm.provider,
                  llmManager.currentLlm.modelName
                );
              return <IconComponent size={16} className={className} />;
            }}
            onClick={() => setOpen(true)}
            transient={open}
            folded={folded}
            rightChevronIcon
            disabled={disabled}
            className={disabled ? "bg-transparent" : ""}
          >
            {getDisplayNameForModel(llmManager.currentLlm.modelName)}
          </SelectButton>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="max-h-[20rem] w-[15rem] p-1 border rounded-08 shadow-lg flex flex-col"
      >
        <div className="overflow-y-scroll">
          {/* UCSD Patch */}
          {isLoadingProviders ? (
            <LineItem key="loading" icon={SimpleLoader}>
              Loading models...
            </LineItem>
          ) : (
            (() => {
              const groupingEnabled = settings?.settings?.group_local_models;
              let lastSection: string | undefined = undefined;

              return llmOptionsToChooseFrom.map(
                ({ modelName, provider, name, icon, section }, index) => {
                  if (
                    requiresImageGeneration &&
                    !modelSupportsImageInput(llmProviders, modelName, name)
                  )
                    return null;

                  // Show section header if grouping is enabled and section changed
                  const showSectionHeader =
                    groupingEnabled && section && section !== lastSection;
                  if (section) {
                    lastSection = section;
                  }

                  return (
                    <React.Fragment key={index}>
                      {showSectionHeader && (
                        <div className="px-spacing-interline py-1 mt-1 first:mt-0 text-xs font-semibold text-text-700 uppercase tracking-wide">
                          {section === "local" ? "On-Premises" : "Cloud-Hosted"}
                        </div>
                      )}
                      <LineItem
                        key={index}
                        icon={({ className }) => icon({ size: 16, className })}
                        onClick={() => {
                          llmManager.updateCurrentLlm({
                            modelName,
                            provider,
                            name,
                          } as LlmDescriptor);
                          onSelect?.(structureValue(name, provider, modelName));
                          setOpen(false);
                        }}
                        className={buildPlausibleClasses("Model+Selected", {
                          model: sanitizeForPlausible(modelName),
                          provider: sanitizeForPlausible(provider),
                        })}
                      >
                        {getDisplayNameForModel(modelName)}
                      </LineItem>
                    </React.Fragment>
                  );
                }
              );
            })()
          )}
          {/* End UCSD Patch */}
        </div>
        {user?.preferences?.temperature_override_enabled && (
          <div className="flex flex-col w-full py-3 px-2 gap-2">
            <Slider
              value={[localTemperature]}
              max={llmManager.maxTemperature}
              min={0}
              step={0.01}
              onValueChange={handleTemperatureChange}
              onValueCommit={handleTemperatureChangeComplete}
              className="w-full"
            />
            <div className="flex flex-row items-center justify-between">
              <Text secondaryBody>Temperature (creativity)</Text>
              <Text secondaryBody>{localTemperature.toFixed(1)}</Text>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
