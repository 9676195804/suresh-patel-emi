import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ThankYouAgreement } from '../components/admin/ThankYouAgreement';

export interface NOCData {
  purchase: any;
  shopDetails: {
    name: string;
    address: string;
    phone: string;
    proprietor?: string;
    gstin?: string;
    email?: string;
  };
  shopSignUrl?: string;
}

export const generateNOCPDF = async (nocData: NOCData): Promise<Blob> => {
  try {
    // Create a temporary container for the NOC certificate
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = 'white';
    
    // Import the NOC component
    const { NOCCertificate } = await import('../components/admin/NOCCertificate');
    
    // Create a simple HTML version for PDF generation
    container.innerHTML = `
      <div style="padding: 32px; font-family: Arial, sans-serif; background: white;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #333;">${nocData.shopDetails.name}</h1>
          <p style="font-size: 16px; color: #666;">${nocData.shopDetails.address}</p>
          <p style="font-size: 14px; color: #666;">
            Phone: ${nocData.shopDetails.phone}
            ${nocData.shopDetails.email ? ` | Email: ${nocData.shopDetails.email}` : ''}
            ${nocData.shopDetails.gstin ? ` | GSTIN: ${nocData.shopDetails.gstin}` : ''}
          </p>
        </div>
        
        <div style="border-top: 2px solid #ccc; border-bottom: 2px solid #ccc; padding: 16px 0; margin: 24px 0;">
          <h2 style="font-size: 32px; font-weight: bold; color: #1e40af; margin: 0;">NO OBJECTION CERTIFICATE</h2>
          <p style="font-size: 16px; color: #666; margin: 8px 0 0 0;">
            Certificate No: NOC-${nocData.purchase.id}-${Date.now()}<br>
            Date of Issue: ${new Date().toLocaleDateString('en-IN')}
          </p>
        </div>
        
        <div style="margin-bottom: 32px; text-align: justify;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            This is to certify that <strong>${nocData.purchase.customer?.name}</strong>, 
            residing at <strong>${nocData.purchase.customer?.address || 'Address not provided'}</strong>, 
            holding mobile number <strong>${nocData.purchase.customer?.mobile}</strong> and 
            Aadhaar number <strong>${nocData.purchase.customer?.aadhaar || 'N/A'}</strong>, 
            has successfully completed all EMI payments for the purchase made from our establishment.
          </p>
          
          <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="font-size: 20px; font-weight: bold; margin: 0 0 16px 0; text-align: center;">PURCHASE DETAILS</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p><strong>Product Name:</strong> ${nocData.purchase.product_name}</p>
                <p><strong>Total Amount:</strong> ₹${nocData.purchase.total_price.toFixed(2)}</p>
                <p><strong>Down Payment:</strong> ₹${nocData.purchase.down_payment.toFixed(2)}</p>
                <p><strong>EMI Amount:</strong> ₹${nocData.purchase.emi_amount.toFixed(2)}</p>
              </div>
              <div>
                <p><strong>Tenure:</strong> ${nocData.purchase.tenure} months</p>
                <p><strong>Start Date:</strong> ${nocData.purchase.created_at ? new Date(nocData.purchase.created_at).toLocaleDateString('en-IN') : 'N/A'}</p>
                <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                <p><strong>Total Paid:</strong> ₹${(nocData.purchase.total_price).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            The customer has fulfilled all financial obligations related to this purchase, including all monthly installments, 
            interest charges, and any applicable fees. All ${nocData.purchase.tenure} EMI payments have been received in full and on time.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Based on the satisfactory completion of all payment obligations, we hereby issue this No Objection Certificate 
            confirming that there are no outstanding dues, liabilities, or objections against the above-mentioned customer 
            for this particular purchase.
          </p>
          
          <div style="background-color: #eff6ff; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">DECLARATION</h4>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
              This certificate is issued at the request of the customer for their records and future reference. 
              The customer is free from any financial obligations related to this purchase. We appreciate the customer's 
              prompt payment behavior and cooperation throughout the EMI tenure.
            </p>
            <p style="font-size: 14px; color: #6b7280; font-style: italic; margin: 0;">
              "Thank you for your business and trust in our services."
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            This certificate is valid for all legal and official purposes and is issued without any reservations.
          </p>
          
          <div style="background-color: #f0fdf4; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
            <h4 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">ACKNOWLEDGMENT</h4>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
              We thank <strong>${nocData.purchase.customer?.name}</strong> for choosing our services and maintaining 
              a satisfactory payment record. We wish them all the best for their future endeavors.
            </p>
            <p style="font-size: 14px; color: #6b7280; font-style: italic; margin: 0;">
              "Thank you for your business and trust in our services."
            </p>
          </div>
        </div>
        
        <div style="margin-bottom: 32px;">
          <h4 style="font-size: 18px; font-weight: bold; margin: 0 0 16px 0;">TERMS AND CONDITIONS</h4>
          <ol style="font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>This certificate is issued based on the records available with us as of the date of issue.</li>
            <li>This certificate pertains only to the specific purchase mentioned above.</li>
            <li>This certificate does not guarantee any future transactions or purchases.</li>
            <li>The certificate is valid only if the official seal and authorized signature are present.</li>
            <li>Any alterations to this certificate will render it invalid.</li>
          </ol>
        </div>
        
        <div style="margin-top: 64px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: center;">
              ${nocData.shopSignUrl ? `<img src="${nocData.shopSignUrl}" alt="${nocData.shopDetails.name} Shop Sign" style="height: 48px; width: auto; margin: 0 auto 8px auto;">` : ''}
              <div style="border-top: 2px solid #9ca3af; padding-top: 8px;">
                <p style="font-weight: bold; margin: 0;">${nocData.shopDetails.proprietor || 'Proprietor'}</p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">For ${nocData.shopDetails.name}</p>
                <p style="font-size: 10px; color: #9ca3af; margin: 0;">Authorized Signatory</p>
              </div>
            </div>
            
            <div style="text-align: center;">
              <div style="border-top: 2px solid #9ca3af; padding-top: 8px;">
                <p style="font-weight: bold; margin: 0;">Customer Signature</p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">${purchase.customer?.name}</p>
                <p style="font-size: 10px; color: #9ca3af; margin: 0;">Date: ${new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 48px; text-align: center; border-top: 1px solid #d1d5db; padding-top: 24px;">
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">
            This is a computer-generated certificate and does not require a physical seal. 
            For verification, contact: ${nocData.shopDetails.phone}
          </p>
          <p style="font-size: 10px; color: #9ca3af; margin: 0;">
            Generated on ${new Date().toLocaleString('en-IN')} | Certificate ID: NOC-${purchase.id}-${Date.now()}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      // Use html2canvas to convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width at 96 DPI
        height: 1123, // A4 height at 96 DPI
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add pages if content exceeds one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Convert to blob
      const pdfBlob = pdf.output('blob');
      
      // Clean up
      document.body.removeChild(container);
      
      return pdfBlob;
    } catch (error) {
      document.body.removeChild(container);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    throw new Error(`Failed to generate NOC certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const downloadNOC = async (nocData: NOCData): Promise<void> => {
  try {
    const pdfBlob = await generateNOCPDF(nocData);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NOC-${nocData.purchase.id}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading NOC:', error);
    throw new Error(`Failed to download NOC certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateNOCDownloadLink = async (nocData: NOCData): Promise<string> => {
  try {
    const pdfBlob = await generateNOCPDF(nocData);
    
    // Create blob URL for temporary access
    const url = URL.createObjectURL(pdfBlob);
    
    return url;
  } catch (error) {
    console.error('Error generating NOC download link:', error);
    throw new Error(`Failed to generate NOC download link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateThankYouAgreementPDF = async (nocData: NOCData): Promise<Blob> => {
  try {
    // Create a temporary container for the thank-you agreement
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm';
    container.style.backgroundColor = 'white';

    // Import the ThankYouAgreement component
    const { ThankYouAgreement } = await import('../components/admin/ThankYouAgreement');

    // Create simple HTML for PDF generation
    container.innerHTML = `
      <div style="padding: 32px; font-family: Arial, sans-serif; background: white;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #333;">${nocData.shopDetails.name}</h1>
          <p style="font-size: 16px; color: #666;">${nocData.shopDetails.address}</p>
          <p style="font-size: 14px; color: #666;">
            Phone: ${nocData.shopDetails.phone}
            ${nocData.shopDetails.email ? ` | Email: ${nocData.shopDetails.email}` : ''}
            ${nocData.shopDetails.gstin ? ` | GSTIN: ${nocData.shopDetails.gstin}` : ''}
          </p>
        </div>

        <div style="border-top: 2px solid #ccc; border-bottom: 2px solid #ccc; padding: 16px 0; margin: 24px 0;">
          <h2 style="font-size: 32px; font-weight: bold; color: #16a34a; margin: 0;">THANK YOU AGREEMENT</h2>
          <p style="font-size: 16px; color: #666; margin: 8px 0 0 0;">
            Agreement No: TYA-${nocData.purchase.id}-${Date.now()}<br>
            Date of Issue: ${new Date().toLocaleDateString('en-IN')}
          </p>
        </div>

        <div style="margin-bottom: 32px; text-align: justify;">
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Dear <strong>${nocData.purchase.customer?.name}</strong>,
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We would like to express our heartfelt gratitude for choosing <strong>${nocData.shopDetails.name}</strong>
            for your recent purchase. It has been our pleasure to serve you, and we are delighted that you have
            successfully completed all EMI payments for your purchase.
          </p>

          <div style="background-color: #f0fdf4; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="font-size: 20px; font-weight: bold; margin: 0 0 16px 0; text-align: center;">PURCHASE SUMMARY</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p><strong>Product Name:</strong> ${nocData.purchase.product_name}</p>
                <p><strong>Total Amount:</strong> ₹${nocData.purchase.total_price.toFixed(2)}</p>
                <p><strong>Down Payment:</strong> ₹${nocData.purchase.down_payment.toFixed(2)}</p>
                <p><strong>EMI Amount:</strong> ₹${nocData.purchase.emi_amount.toFixed(2)}</p>
              </div>
              <div>
                <p><strong>Tenure:</strong> ${nocData.purchase.tenure} months</p>
                <p><strong>Start Date:</strong> ${nocData.purchase.created_at ? new Date(nocData.purchase.created_at).toLocaleDateString('en-IN') : 'N/A'}</p>
                <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                <p><strong>Total Paid:</strong> ₹${(nocData.purchase.total_price).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Your commitment to timely payments and cooperation throughout the EMI tenure is greatly appreciated.
            Your trust in our services means a lot to us, and we hope that our product has met your expectations.
          </p>

          <div style="background-color: #fef3c7; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">OUR COMMITMENT TO YOU</h4>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
              Even though your EMI tenure is complete, our relationship doesn't end here. We remain committed to
              providing you with excellent after-sales service and support. Should you have any questions or require
              assistance with your product, please do not hesitate to contact us.
            </p>
            <p style="font-size: 14px; color: #854d0e; font-style: italic; margin: 0;">
              "Your satisfaction is our priority, today and always."
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We would love to hear about your experience with our product and service. Your feedback helps us
            improve and serve our customers better. We also hope that you will consider us for your future needs
            and recommend our services to your friends and family.
          </p>

          <div style="background-color: #eff6ff; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">SPECIAL OFFERS FOR LOYAL CUSTOMERS</h4>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
              As a valued customer who has completed their payments successfully, you may be eligible for special
              discounts and offers on future purchases. Please contact us to learn more about our loyalty programs
              and exclusive deals for returning customers.
            </p>
            <p style="font-size: 14px; color: #1d4ed8; font-style: italic; margin: 0;">
              "Good customers are the foundation of our business."
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            Once again, thank you for your business and trust. We wish you many years of satisfaction and
            enjoyment with your purchase. May our product serve you well and bring value to your life.
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            We look forward to serving you again in the future.
          </p>
        </div>

        <div style="margin-bottom: 32px;">
          <h4 style="font-size: 18px; font-weight: bold; margin: 0 0 16px 0;">ACKNOWLEDGMENT</h4>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
            This agreement serves as a token of our appreciation and acknowledgment of your successful completion
            of all payment obligations. Your prompt payment behavior and cooperation have been exemplary.
          </p>
          <p style="font-size: 14px; color: #6b7280; font-style: italic; margin: 0;">
            "Thank you for being an exceptional customer."
          </p>
        </div>

        <div style="margin-top: 64px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: center;">
              ${nocData.shopSignUrl ? `<img src="${nocData.shopSignUrl}" alt="${nocData.shopDetails.name} Shop Sign" style="height: 48px; width: auto; margin: 0 auto 8px auto;">` : ''}
              <div style="border-top: 2px solid #9ca3af; padding-top: 8px;">
                <p style="font-weight: bold; margin: 0;">${nocData.shopDetails.proprietor || 'Proprietor'}</p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">For ${nocData.shopDetails.name}</p>
                <p style="font-size: 10px; color: #9ca3af; margin: 0;">Authorized Signatory</p>
              </div>
            </div>

            <div style="text-align: center;">
              <div style="border-top: 2px solid #9ca3af; padding-top: 8px;">
                <p style="font-weight: bold; margin: 0;">Customer Acknowledgment</p>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">${nocData.purchase.customer?.name}</p>
                <p style="font-size: 10px; color: #9ca3af; margin: 0;">Date: ${new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 48px; text-align: center; border-top: 1px solid #d1d5db; padding-top: 24px;">
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">
            This is a computer-generated agreement and does not require a physical seal.
            For verification, contact: ${nocData.shopDetails.phone}
          </p>
          <p style="font-size: 10px; color: #9ca3af; margin: 0;">
            Generated on ${new Date().toLocaleString('en-IN')} | Agreement ID: TYA-${nocData.purchase.id}-${Date.now()}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBlob = pdf.output('blob');
      document.body.removeChild(container);
      return pdfBlob;
    } catch (error) {
      document.body.removeChild(container);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    throw new Error(`Failed to generate Thank You Agreement: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const downloadThankYouAgreement = async (nocData: NOCData): Promise<void> => {
  try {
    const pdfBlob = await generateThankYouAgreementPDF(nocData);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ThankYouAgreement-${nocData.purchase.id}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading Thank You Agreement:', error);
    throw new Error(`Failed to download Thank You Agreement: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateThankYouAgreementDownloadLink = async (nocData: NOCData): Promise<string> => {
  try {
    const pdfBlob = await generateThankYouAgreementPDF(nocData);
    const url = URL.createObjectURL(pdfBlob);
    return url;
  } catch (error) {
    console.error('Error generating Thank You Agreement download link:', error);
    throw new Error(`Failed to generate Thank You Agreement download link: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};