import React, { useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  TextField,
  Popover,
  Chip,
  Switch,
  Slider,
  Tooltip,
  Button,
  FormControlLabel,
  styled,
} from "@mui/material";
import {
  AccessTime,
  Add,
  Settings,
  FilterList,
  HelpOutline,
  VisibilityOff,
  Visibility,
  LibraryAdd,
  DateRange,
  TuneRounded,
} from "@mui/icons-material";
import {
  TimeRange,
  useFilter,
  DayOfWeek,
  FilterActionType,
  DaysOfWeek,
} from "@/app/context/filter";

// Common academic time slots in Brazil
const ACADEMIC_PRESETS = [
  {
    label: "Manhã",
    range: { start: "07:00", end: "13:00" },
  },
  {
    label: "Tarde",
    range: { start: "13:00", end: "19:00" },
  },
  {
    label: "Noite",
    range: { start: "19:00", end: "23:00" },
  },
];

const TimeSelector = ({
  selectedRanges,
  onChange,
}: {
  selectedRanges: TimeRange[];
  onChange: (ranges: TimeRange[]) => void;
}) => {
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("09:10");

  const handleAddRange = () => {
    if (startTime && endTime && startTime < endTime) {
      const newRange = {
        start: startTime,
        end: endTime,
      };

      // Check if range already exists
      const rangeExists = selectedRanges.some(
        (range) => range.start === newRange.start && range.end === newRange.end
      );

      if (!rangeExists) {
        onChange(
          [...selectedRanges, newRange].sort((a, b) =>
            a.start.localeCompare(b.start)
          )
        );
      }
    }
  };

  const handleRemoveRange = (index: number) => {
    const newRanges = selectedRanges.filter((_, i) => i !== index);
    onChange(newRanges);
  };

  const handleAddPreset = (preset: { label: string; range: TimeRange }) => {
    const newRanges = [...selectedRanges];

    const rangeExists = selectedRanges.some(
      (existing) =>
        existing.start === preset.range.start &&
        existing.end === preset.range.end
    );

    if (!rangeExists) {
      newRanges.push(preset.range);
    }

    onChange(newRanges.sort((a, b) => a.start.localeCompare(b.start)));
  };

  const isValidTimeRange = () => {
    return startTime < endTime;
  };

  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Início"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          inputProps={{
            step: 600, // 10 minutes
          }}
          size="small"
          fullWidth
        />
        <TextField
          label="Fim"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          inputProps={{
            step: 600, // 10 minutes
          }}
          size="small"
          fullWidth
        />
      </Box>

      <Button
        variant="outlined"
        fullWidth
        onClick={handleAddRange}
        disabled={!isValidTimeRange()}
      >
        Adicionar Horário
      </Button>

      <Box className="space-y-2">
        <Typography variant="subtitle2" color="textSecondary">
          Adicionar período completo:
        </Typography>
        <Box className="flex flex-wrap gap-2">
          {ACADEMIC_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outlined"
              size="small"
              onClick={() => handleAddPreset(preset)}
              startIcon={<Add />}
              title={`Adicionar horários: ${preset.range.start}-${preset.range.end}`}
              disabled={selectedRanges.some(
                (range) =>
                  range.start === preset.range.start &&
                  range.end === preset.range.end
              )}
            >
              {preset.label}
            </Button>
          ))}
        </Box>
      </Box>

      {selectedRanges.length > 0 && (
        <Box className="space-y-2">
          <Typography variant="subtitle2" color="textSecondary">
            Horários selecionados:
          </Typography>
          <Box className="flex flex-wrap gap-2">
            {selectedRanges.map((range, index) => (
              <Chip
                key={`${range.start}-${range.end}`}
                label={`${range.start}-${range.end}`}
                onDelete={() => handleRemoveRange(index)}
                icon={<AccessTime fontSize="small" />}
                size="medium"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Styled compact button for days
const DayButton = styled(Button)(({ theme }) => ({
  padding: "0px",
  borderRadius: "50%",
  "&.MuiButton-containedPrimary": {
    backgroundColor: theme.palette.primary.light,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  "&.MuiButton-outlined": {
    borderColor: theme.palette.grey[300],
    color: theme.palette.text.secondary,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.grey[400],
    },
  },
}));

interface DaySelectorProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
}

const DaySelector = ({ selectedDays, onChange }: DaySelectorProps) => {
  const days: {
    value: DayOfWeek;
    label: string;
    shortLabel: string;
  }[] = [
    { value: "SEG", label: "Segunda", shortLabel: "S" },
    { value: "TER", label: "Terça", shortLabel: "T" },
    { value: "QUA", label: "Quarta", shortLabel: "Q" },
    { value: "QUI", label: "Quinta", shortLabel: "Q" },
    { value: "SEX", label: "Sexta", shortLabel: "S" },
    { value: "SAB", label: "Sábado", shortLabel: "S" },
  ];

  const toggleDay = (dayValue: DayOfWeek) => {
    const newDays = selectedDays.includes(dayValue)
      ? selectedDays.filter((d) => d !== dayValue)
      : [...selectedDays, dayValue];
    onChange(newDays);
  };

  return (
    <Box className="flex flex-wrap gap-2">
      {days.map((day) => (
        <DayButton
          key={day.value}
          variant={selectedDays.includes(day.value) ? "contained" : "outlined"}
          onClick={() => toggleDay(day.value)}
          title={day.label} // Adds tooltip with full day name
          classes={{
            root: "!min-w-8 w-8 h-8 md:w-10 md:h-10",
          }}
        >
          <span className="text-xs md:text-sm">{day.value}</span>
        </DayButton>
      ))}
    </Box>
  );
};

// PreferenceSlider Component
const PreferenceSlider = ({
  value,
  onChange,
  title,
  tooltip,
}: {
  value: number;
  onChange: (value: number) => void;
  title: string;
  tooltip: string;
}) => {
  return (
    <Box className="space-y-4">
      <Box className="flex items-center justify-between">
        <Typography variant="subtitle1" fontWeight={"bold"}>
          {title}
        </Typography>
        <Tooltip title={tooltip}>
          <HelpOutline fontSize="small" className="text-gray-500 cursor-help" />
        </Tooltip>
      </Box>
      <Box className="px-2">
        <Slider
          value={value}
          onChange={(_, newValue) => onChange(newValue as number)}
          min={1}
          max={5}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
};

// FilterSummary Component
const FilterSummary: React.FC = () => {
  const {
    state: {
      timeRanges,
      selectedDays,
      includeElective,
      ignorePrerequisite,
      dayWeight,
      gapWeight,
    },
    dispatch,
  } = useFilter();

  if (
    timeRanges.length === 0 &&
    selectedDays.length === 0 &&
    dayWeight === 1 &&
    gapWeight === 1 &&
    includeElective === false &&
    ignorePrerequisite === true
  ) {
    return <Typography color="text.secondary">Nenhum filtro ativo</Typography>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Box>
        <span className="flex items-center mb-2">
          {ignorePrerequisite ? (
            <VisibilityOff fontSize="small" style={{ marginRight: 8 }} />
          ) : (
            <Visibility fontSize="small" style={{ marginRight: 8 }} />
          )}
          Ignorar Pré-Requisitos: {ignorePrerequisite ? "Sim" : "Não"}
        </span>
      </Box>
      <Box>
        <span className="flex items-center mb-2">
          <LibraryAdd fontSize="small" style={{ marginRight: 8 }} />
          Incluir Eletivas: {includeElective ? "Sim" : "Não"}
        </span>
      </Box>
      {timeRanges.length > 0 && (
        <Box>
          <span className="flex items-center mb-2">
            <AccessTime fontSize="small" style={{ marginRight: 8 }} />
            Horários:
          </span>
          <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
            {timeRanges.map((range) => {
              const label = `${range.start}-${range.end}`;
              return <Chip key={label} label={label} size="small" />;
            })}
          </Box>
        </Box>
      )}
      {selectedDays.length > 0 && (
        <Box>
          <span className="flex items-center mb-2">
            <DateRange fontSize="small" style={{ marginRight: 8 }} />
            Dias da semana:
          </span>
          <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
            {selectedDays.map((day) => (
              <Chip key={day} label={DaysOfWeek[day]} size="small" />
            ))}
          </Box>
        </Box>
      )}
      {(dayWeight !== 1 || gapWeight !== 1) && (
        <Box>
          <span className="flex items-center mb-2">
            <TuneRounded fontSize="small" style={{ marginRight: 8 }} />
            Preferências:
          </span>
          <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
            {dayWeight !== 1 && (
              <Chip label={`Peso dos dias: ${dayWeight}`} size="small" />
            )}
            {gapWeight !== 1 && (
              <Chip label={`Peso dos intervalos: ${gapWeight}`} size="small" />
            )}
          </Box>
        </Box>
      )}
    </div>
  );
};

// Main FilterSection Component
export const FilterSection = () => {
  const {
    state: {
      timeRanges,
      selectedDays,
      includeElective,
      ignorePrerequisite,
      dayWeight,
      gapWeight,
    },
    dispatch,
  } = useFilter();

  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(
    null
  );

  return (
    <Box className="space-y-6">
      <Box className="flex items-center justify-between">
        <Typography variant="h6">Filtrando por:</Typography>
        <Box className="flex gap-2">
          <Tooltip title="Filtros">
            <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
              <FilterList />
            </IconButton>
          </Tooltip>
          <Tooltip title="Preferências">
            <IconButton onClick={(e) => setSettingsAnchorEl(e.currentTarget)}>
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box className="p-4 w-80 md:w-96 space-y-4">
          <Typography variant="subtitle1" className="mb-4">
            Horários
          </Typography>
          <TimeSelector
            selectedRanges={timeRanges}
            onChange={(ranges) =>
              dispatch({
                type: FilterActionType.SET_TIME_RANGES,
                payload: ranges,
              })
            }
          />

          <Typography variant="subtitle1" className="mb-4">
            Dias da Semana
          </Typography>
          <DaySelector
            selectedDays={selectedDays}
            onChange={(days: DayOfWeek[]) =>
              dispatch({
                type: FilterActionType.SET_DAYS,
                payload: days,
              })
            }
          />

          <FormControlLabel
            labelPlacement="start"
            style={{
              justifyContent: "space-between",
              width: "100%",
              marginLeft: "4px",
            }}
            control={
              <Switch
                checked={includeElective}
                onChange={(e) =>
                  dispatch({
                    type: FilterActionType.SET_INCLUDE_ELECTIVE,
                    payload: e.target.checked,
                  })
                }
              />
            }
            label="Incluir Eletivas"
          />

          <FormControlLabel
            labelPlacement="start"
            style={{
              justifyContent: "space-between",
              width: "100%",
              marginLeft: "4px",
            }}
            control={
              <Switch
                checked={ignorePrerequisite}
                onChange={(e) =>
                  dispatch({
                    type: FilterActionType.SET_IGNORE_PREREQUISITE,
                    payload: e.target.checked,
                  })
                }
              />
            }
            label="Ignorar Pré-Requisitos"
          />
        </Box>
      </Popover>

      <Popover
        open={Boolean(settingsAnchorEl)}
        anchorEl={settingsAnchorEl}
        onClose={() => setSettingsAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box className="p-4 w-80 md:w-96 space-y-6">
          <PreferenceSlider
            value={dayWeight}
            onChange={(value) =>
              dispatch({
                type: FilterActionType.SET_DAY_WEIGHT,
                payload: value,
              })
            }
            title="Peso dos dias com aulas"
            tooltip="Um valor mais alto prioriza grades com menos dias de aula na semana."
          />
          <PreferenceSlider
            value={gapWeight}
            onChange={(value) =>
              dispatch({
                type: FilterActionType.SET_GAP_WEIGHT,
                payload: value,
              })
            }
            title="Peso dos intervalos entre aulas"
            tooltip="Um valor mais alto prioriza grades com menos intervalos vazios entre as aulas."
          />
        </Box>
      </Popover>

      <FilterSummary />
    </Box>
  );
};
