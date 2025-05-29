import axios from 'axios';
import { createReadStream } from 'fs';
import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method === 'GET') {
    // Handle service list request
    const action = new URL(req.url).searchParams.get('action');
    
    if (action === 'list') {
      try {
        // Fetch list of available uploaders from Nozawa's API
        const response = await axios.get('https://r-nozawa-uploader.hf.space/list');
        const services = response.data;
        
        return NextResponse.json({
          success: true,
          services: services
        });
      } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to fetch services'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 });
  } else if (req.method === 'POST') {
    // Handle file upload
    try {
      const formData = await req.formData();
      const file = formData.get('file');
      const service = formData.get('service');
      
      if (!file || !service) {
        return NextResponse.json({
          success: false,
          message: 'File and service are required'
        }, { status: 400 });
      }
      
      // Convert the file to a stream
      const fileStream = file.stream();
      
      // Create FormData to send to Nozawa's API
      const uploadFormData = new FormData();
      uploadFormData.append('file', fileStream, file.name);
      uploadFormData.append('uploader', service);
      
      // Upload to Nozawa's API
      const uploadResponse = await axios.post('https://r-nozawa-uploader.hf.space/', uploadFormData, {
        headers: {
          ...uploadFormData.getHeaders()
        }
      });
      
      return NextResponse.json({
        success: true,
        data: uploadResponse.data
      });
    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json({
        success: false,
        message: error.response?.data?.message || error.message || 'Upload failed'
      }, { status: 500 });
    }
  }
  
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}
