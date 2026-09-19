import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../store';
import {
  setActivityFilter as setReduxActivityFilter,
  setSelectedFormType as setReduxSelectedFormType,
  setActivityContentInput as setReduxActivityContentInput,
} from '../../../../store/slices/inventorySlice';
import { createLotActivityThunk } from '../../../../services/inventoryService';

interface UseLotActivitiesStreamParams {
  lot: any;
  lotActivities?: any[];
  activityFilter?: string;
  setActivityFilter?: (val: string) => void;
  activityTypeInput?: string;
  setActivityTypeInput?: (val: string) => void;
  activityContentInput?: string;
  setActivityContentInput?: (val: string) => void;
  handleCreateLotActivity?: () => void;
}

export function useLotActivitiesStream({
  lot,
  lotActivities = [],
  activityFilter = 'all',
  setActivityFilter: propSetActivityFilter,
  activityTypeInput = 'Email',
  setActivityTypeInput: propSetActivityTypeInput,
  activityContentInput = '',
  setActivityContentInput: propSetActivityContentInput,
  handleCreateLotActivity,
}: UseLotActivitiesStreamParams) {
  const dispatch = useDispatch<AppDispatch>();

  const filteredActivities = useMemo(() => {
    return (lotActivities || []).filter((act: any) => {
      if (activityFilter === 'all') return true;
      return act.type?.toLowerCase() === activityFilter.toLowerCase();
    });
  }, [lotActivities, activityFilter]);

  const handleActivityFilterChange = (val: string) => {
    if (propSetActivityFilter) {
      propSetActivityFilter(val);
    } else {
      dispatch(setReduxActivityFilter(val));
    }
  };

  const handleActivityTypeInputChange = (val: string) => {
    if (propSetActivityTypeInput) {
      propSetActivityTypeInput(val);
    } else {
      dispatch(setReduxSelectedFormType(val));
    }
  };

  const handleActivityContentInputChange = (val: string) => {
    if (propSetActivityContentInput) {
      propSetActivityContentInput(val);
    } else {
      dispatch(setReduxActivityContentInput(val));
    }
  };

  const handleCreateLotActivityAction = () => {
    if (handleCreateLotActivity) {
      handleCreateLotActivity();
    } else if (lot?._id && activityContentInput.trim()) {
      const content = activityContentInput.trim();
      dispatch(setReduxActivityContentInput(''));
      dispatch(
        createLotActivityThunk({
          lotId: lot._id,
          payload: {
            type: activityTypeInput || 'Email',
            content,
            author: 'Supplier Account',
          },
        }) as any
      );
    }
  };

  return {
    filteredActivities,
    activityFilter,
    activityTypeInput,
    activityContentInput,
    handleActivityFilterChange,
    handleActivityTypeInputChange,
    handleActivityContentInputChange,
    handleCreateLotActivityAction,
  };
}
