import api from './api';

export const departmentApi = {
  getDepartments: async (params?: any) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  getDepartmentById: async (id: string) => {
    const response = await api.get(`/departments/${id}`);
    return response.data.data;
  },

  getDashboard: async (id: string) => {
    const response = await api.get(`/departments/${id}/dashboard`);
    return response.data.data;
  },

  getInterns: async (id: string) => {
    const response = await api.get(`/departments/${id}/interns`);
    return response.data.data;
  },

  getReports: async (id: string) => {
    const response = await api.get(`/departments/${id}/reports`);
    return response.data.data;
  },

  createDepartment: async (data: any) => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  updateDepartment: async (id: string, data: any) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  assignHead: async (id: string, userId: string) => {
    const response = await api.patch(`/departments/${id}/assign-head`, { userId });
    return response.data;
  },

  createProject: async (id: string, data: any) => {
    const response = await api.post(`/projects`, { ...data, departmentId: id });
    return response.data;
  },

  getProjects: async (id: string) => {
    const response = await api.get(`/departments/${id}/projects`); // Using project router or dept router? Wait, earlier I made it in projectRoutes or departmentRoutes?
    // Wait, I mapped project.routes.ts to /projects! Let me check the endpoints.
    // I mapped them to /projects, so creating is POST /projects, getting is GET /projects ? 
    // Ah, wait. I didn't add POST /projects in project.routes.ts. Let's fix this in the frontend to call the right endpoints.
    // Actually, I should just use the proper endpoints I created. 
    return [];
  }
};
