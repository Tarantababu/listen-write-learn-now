
/**
 * This is a placeholder hook for the removed roadmap functionality
 * It provides empty values to prevent errors in components that might still reference it
 */
export function useRoadmap() {
  return {
    roadmaps: [],
    userRoadmaps: [],
    currentRoadmap: null,
    nodes: [],
    currentNodeId: undefined,
    currentNode: null,
    completedNodes: [],
    availableNodes: [],
    nodeProgress: [],
    isLoading: false,
    nodeLoading: false,
    initializeUserRoadmap: async () => '',
    loadUserRoadmaps: async () => [],
    loadRoadmaps: async () => [],
    selectRoadmap: async () => [],
    resetProgress: async () => {},
    getNodeExercise: async () => null,
    markNodeAsCompleted: async () => {},
    recordNodeCompletion: async () => ({}),
    incrementNodeCompletion: async () => ({}),
  };
}
