import api from './api';

const subscriptionService = {
  getMyPlan: () => {
    return api.get('/api/subscriptions/my-plan');
  },
  
  getUsage: () => {
    return api.get('/api/subscriptions/usage');
  },
  
  getHistory: () => {
    return api.get('/api/subscriptions/history');
  },
  
  upgradePlan: (newType) => {
    return api.post('/api/subscriptions/upgrade', null, { params: { newType } });
  },
  
  renewPlan: () => {
    return api.post('/api/subscriptions/renew');
  },

  getAllPlans: () => {
    return api.get('/api/subscriptions/plans');
  },

};

export default subscriptionService;
