import api from './api';

const analyticsService = {
    /**
     * Fetch branch manager dashboard KPIs + charts + tables.
     * range: 'today' | 'week' | 'month'
     */
    getBranchDashboard: async (range = 'week') => {
        return await api.get('/api/analytics/branch/dashboard', { params: { range } });
    },
    
    /**
     * Fetch store admin enterprise dashboard KPIs + charts + tables.
     * range: 'today' | 'week' | 'month'
     */
    getEnterpriseDashboard: async (range = 'month') => {
        return await api.get('/api/analytics/store/dashboard', { params: { range } });
    }
};

export default analyticsService;
