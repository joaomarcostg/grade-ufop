import React, { useState } from "react";
import {
  Button,
  Chip,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  SelectChangeEvent,
  Slider,
  Typography,
  Tooltip,
  Box,
  IconButton,
} from "@mui/material";
import {
  AccessTime,
  DateRange,
  FilterList,
  HelpOutline,
  TuneRounded,
  Settings,
} from "@mui/icons-material";
import { useFilter, TIME_SLOTS, DAYS_OF_WEEK } from "./FilterContext";

const FilterSummary: React.FC<{
  timeSlots: string[];
  days: string[];
  dayWeight: number;
  gapWeight: number;
}> = ({ timeSlots, days, dayWeight, gapWeight }) => {
  if (
    timeSlots.length === 0 &&
    days.length === 0 &&
    dayWeight === 1 &&
    gapWeight === 1
  ) {
    return <Typography color="text.secondary">Nenhum filtro ativo</Typography>;
  }

  return (
    <div className="flex flex-col gap-4">
      {timeSlots.length > 0 && (
        <Box>
          <span className="flex items-center mb-2">
            <AccessTime fontSize="small" style={{ marginRight: 8 }} />
            Horários:
          </span>
          <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
            {timeSlots.map((slot) => (
              <Chip key={slot} label={slot} size="small" />
            ))}
          </Box>
        </Box>
      )}
      {days.length > 0 && (
        <Box>
          <span className="flex items-center mb-2">
            <DateRange fontSize="small" style={{ marginRight: 8 }} />
            Dias da semana:
          </span>
          <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
            {days.map((day) => (
              <Chip
                key={day}
                label={DAYS_OF_WEEK.find((d) => d.value === day)?.label}
                size="small"
              />
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

export const FilterSection: React.FC = () => {
  const {
    timeSlots,
    setTimeSlots,
    days,
    setDays,
    dayWeight,
    setDayWeight,
    gapWeight,
    setGapWeight,
  } = useFilter();
  const [filterAnchorEl, setFilterAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const filterOpen = Boolean(filterAnchorEl);
  const filterId = filterOpen ? "filter-popover" : undefined;

  const settingsOpen = Boolean(settingsAnchorEl);
  const settingsId = settingsOpen ? "settings-popover" : undefined;

  const allTimesSelected =
    timeSlots.length > 0 && timeSlots.length === TIME_SLOTS.length;
  const allDaysSelected =
    days.length > 0 && days.length === DAYS_OF_WEEK.length;

  const handleTimeSlotChange = (event: SelectChangeEvent<typeof timeSlots>) => {
    const value = event.target.value;
    if (value[value.length - 1] === "all") {
      setTimeSlots(allTimesSelected ? [] : TIME_SLOTS);
      return;
    }
    setTimeSlots(typeof value === "string" ? value.split(",") : value);
  };

  const handleDaysChange = (event: SelectChangeEvent<typeof days>) => {
    const value = event.target.value;
    if (value[value.length - 1] === "all") {
      setDays(allDaysSelected ? [] : DAYS_OF_WEEK.map((day) => day.value));
      return;
    }
    setDays(typeof value === "string" ? value.split(",") : value);
  };

  return (
    <div>
      <div className="flex justify-between">
        <span className="font-bold text-lg">Filtrando por:</span>
        <Box className="mb-4">
          <div className="flex gap-4">
            <Tooltip title="Filtros">
              <IconButton onClick={handleFilterClick}>
                <FilterList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Preferências">
              <IconButton onClick={handleSettingsClick}>
                <Settings />
              </IconButton>
            </Tooltip>
          </div>
          <Popover
            id={filterId}
            open={filterOpen}
            anchorEl={filterAnchorEl}
            onClose={handleFilterClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            slotProps={{
              paper: {
                style: { width: "400px" },
              },
            }}
          >
            <Box className="p-4 space-y-4">
              <FormControl fullWidth>
                <InputLabel>Horário</InputLabel>
                <Select
                  multiple
                  value={timeSlots}
                  onChange={handleTimeSlotChange}
                  input={<OutlinedInput label="Horário" />}
                  renderValue={(selected) =>
                    `${selected.length} selecionado${
                      selected.length !== 1 ? "s" : ""
                    }`
                  }
                >
                  <MenuItem key="all" value="all">
                    <Checkbox checked={allTimesSelected} />
                    <ListItemText primary="Selecionar Todos" />
                  </MenuItem>
                  {TIME_SLOTS.map((slot) => (
                    <MenuItem key={slot} value={slot}>
                      <Checkbox checked={timeSlots.indexOf(slot) > -1} />
                      <ListItemText primary={slot} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Dia da semana</InputLabel>
                <Select
                  multiple
                  value={days}
                  onChange={handleDaysChange}
                  input={<OutlinedInput label="Dia da semana" />}
                  renderValue={(selected) =>
                    `${selected.length} selecionado${
                      selected.length !== 1 ? "s" : ""
                    }`
                  }
                >
                  <MenuItem key="all" value="all">
                    <Checkbox checked={allDaysSelected} />
                    <ListItemText primary="Selecionar Todos" />
                  </MenuItem>
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      <Checkbox checked={days.indexOf(day.value) > -1} />
                      <ListItemText primary={day.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Popover>
          <Popover
            id={settingsId}
            open={settingsOpen}
            anchorEl={settingsAnchorEl}
            onClose={handleSettingsClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            slotProps={{
              paper: {
                style: { width: "400px", padding: "16px" },
              },
            }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <div className="flex items-center">
                  Peso dos dias com aulas
                  <Tooltip title="Um valor mais alto prioriza grades com menos dias de aula na semana.">
                    <HelpOutline
                      fontSize="small"
                      className="ml-2 cursor-help"
                    />
                  </Tooltip>
                </div>
              </Typography>
              <div className="px-2">
                <Slider
                  value={dayWeight}
                  onChange={(_, newValue) => setDayWeight(newValue as number)}
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={5}
                />
              </div>
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <div className="flex items-center">
                  Peso dos intervalos entre aulas
                  <Tooltip title="Um valor mais alto prioriza grades com menos intervalos vazios entre as aulas.">
                    <HelpOutline
                      fontSize="small"
                      className="ml-2 cursor-help"
                    />
                  </Tooltip>
                </div>
              </Typography>
              <div className="px-2">
                <Slider
                  value={gapWeight}
                  onChange={(_, newValue) => setGapWeight(newValue as number)}
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={5}
                />
              </div>
            </Box>
          </Popover>
        </Box>
      </div>

      <FilterSummary
        timeSlots={timeSlots}
        days={days}
        dayWeight={dayWeight}
        gapWeight={gapWeight}
      />
    </div>
  );
};