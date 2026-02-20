"""
Salesforce Service - Abstraction layer for Salesforce integration.

Even though we're using mocks, this service layer demonstrates:
- Clear separation of concerns
- Future-proof integration pattern
- Mapping logic isolation
"""

import json
import os
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from app.models.document import Document
from app.models.case import Case, CaseCreateRequest


class SalesforceService:
    """
    Service layer that abstracts Salesforce API interactions.
    
    In production, this would:
    - Handle OAuth2 authentication
    - Manage API rate limits
    - Implement retry logic
    - Handle Salesforce-specific error codes
    """
    
    def __init__(self, mock_data_dir: str = None):
        if mock_data_dir is None:
            # Resolve path relative to backend directory
            backend_dir = Path(__file__).parent.parent.parent
            mock_data_dir = backend_dir / "mocks" / "salesforce"
        self.mock_data_dir = Path(mock_data_dir)
        self.mock_data_dir.mkdir(parents=True, exist_ok=True)
    
    def get_customer_documents(self, customer_id: str) -> List[Document]:
        """
        Retrieve documents for a customer from Salesforce.
        
        In production, this would call:
        GET /services/data/v58.0/sobjects/ContentDocumentLink/
        with filters for the customer account.
        """
        mock_file = self.mock_data_dir / f"documents-{customer_id}.json"
        
        if not mock_file.exists():
            return []
        
        with open(mock_file, 'r') as f:
            data = json.load(f)
        
        # Map Salesforce response to our DTO
        documents = []
        for doc in data.get('documents', []):
            documents.append(Document(
                document_id=doc['document_id'],
                customer_id=doc['customer_id'],
                name=doc['name'],
                type=doc['type'],
                download_url=doc['download_url'],
                created_date=datetime.fromisoformat(doc['created_date']) if doc.get('created_date') else None
            ))
        
        return documents
    
    def get_customer_cases(self, customer_id: str) -> List[Case]:
        """
        Retrieve cases/tickets for a customer from Salesforce.
        
        In production, this would call:
        GET /services/data/v58.0/query/?q=SELECT+Id,Subject,Description,Status,CreatedDate+FROM+Case+WHERE+AccountId='{customer_id}'
        """
        mock_file = self.mock_data_dir / f"cases-{customer_id}.json"
        
        if not mock_file.exists():
            return []
        
        with open(mock_file, 'r') as f:
            data = json.load(f)
        
        # Map Salesforce response to our DTO
        cases = []
        for case_data in data.get('cases', []):
            cases.append(Case(
                case_id=case_data['case_id'],
                customer_id=case_data['customer_id'],
                subject=case_data['subject'],
                description=case_data.get('description'),
                type=case_data.get('type'),
                status=case_data['status'],
                created_date=datetime.fromisoformat(case_data['created_date'])
            ))
        
        return cases
    
    def create_case(self, customer_id: str, case_request: CaseCreateRequest) -> Case:
        """
        Create a new case in Salesforce.
        
        In production, this would:
        1. POST /services/data/v58.0/sobjects/Case/
        2. Handle Salesforce validation errors
        3. Return Salesforce case ID
        
        For MVP, we simulate by:
        - Generating a mock case ID
        - Saving temporarily as "eingehend" (incoming)
        - Sending to Salesforce mock endpoint (new-case.json or console)
        - Appending to mock file
        - Returning the created case
        """
        # Generate mock case ID (in production, Salesforce returns this)
        import uuid
        case_id = f"500{str(uuid.uuid4()).replace('-', '')[:15]}"
        
        # Create case object with status "eingehend" (incoming) initially
        new_case = Case(
            case_id=case_id,
            customer_id=customer_id,
            subject=case_request.subject,
            description=case_request.description,
            type="Customer Request",
            status="eingehend",  # Temporarily saved as "incoming"
            created_date=datetime.now()
        )
        
        # ============================================
        # MAPPING LOGIC: Transform to Salesforce format
        # ============================================
        # This demonstrates how we would map our internal DTO to Salesforce format
        salesforce_case_data = {
            "Id": new_case.case_id,
            "AccountId": new_case.customer_id,
            "Subject": new_case.subject,
            "Description": new_case.description or "",
            "Type": new_case.type,
            "Status": "New",  # Salesforce status (mapped from "eingehend")
            "Origin": "Web",
            "CreatedDate": new_case.created_date.isoformat()
        }
        
        # Send to Salesforce Mock Endpoint
        # Option 1: Save to new-case.json file (simulating Salesforce API call)
        new_case_file = self.mock_data_dir / "new-case.json"
        with open(new_case_file, 'w', encoding='utf-8') as f:
            json.dump({
                "success": True,
                "id": salesforce_case_data["Id"],
                "salesforce_case": salesforce_case_data
            }, f, indent=2, ensure_ascii=False)
        
        # Option 2: Also log to console to make mapping logic visible
        print("\n" + "="*60)
        print("SALESFORCE MOCK ENDPOINT: New Case Received")
        print("="*60)
        print(f"Mapping from internal DTO to Salesforce format:")
        print(f"  Internal Status: '{new_case.status}' → Salesforce Status: '{salesforce_case_data['Status']}'")
        print(f"  Internal Type: '{new_case.type}' → Salesforce Type: '{salesforce_case_data['Type']}'")
        print(f"  Customer ID: '{new_case.customer_id}' → Salesforce AccountId: '{salesforce_case_data['AccountId']}'")
        print(f"\nSalesforce Case Data:")
        print(json.dumps(salesforce_case_data, indent=2, ensure_ascii=False))
        print("="*60 + "\n")
        
        # Save temporarily locally (as "eingehend")
        # In production, this would be in a temporary queue/database
        temp_file = self.mock_data_dir / f"incoming-cases-{customer_id}.json"
        if temp_file.exists():
            with open(temp_file, 'r', encoding='utf-8') as f:
                temp_data = json.load(f)
        else:
            temp_data = {"incoming_cases": []}
        
        temp_data['incoming_cases'].append({
            "case_id": new_case.case_id,
            "customer_id": new_case.customer_id,
            "subject": new_case.subject,
            "description": new_case.description,
            "type": new_case.type,
            "status": new_case.status,  # "eingehend"
            "created_date": new_case.created_date.isoformat(),
            "salesforce_mapped": salesforce_case_data
        })
        
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(temp_data, f, indent=2, ensure_ascii=False)
        
        # Also append to main cases file (for GET endpoint)
        mock_file = self.mock_data_dir / f"cases-{customer_id}.json"
        if mock_file.exists():
            with open(mock_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {"cases": []}
        
        # Append new case (with status updated to match Salesforce response)
        data['cases'].append({
            "case_id": new_case.case_id,
            "customer_id": new_case.customer_id,
            "subject": new_case.subject,
            "description": new_case.description,
            "type": new_case.type,
            "status": salesforce_case_data["Status"],  # Use Salesforce status
            "created_date": new_case.created_date.isoformat()
        })
        
        # Write back to mock file
        with open(mock_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Update the case status to match what Salesforce would return
        new_case.status = salesforce_case_data["Status"]
        
        # In production, we would also:
        # - Log the case creation
        # - Trigger webhooks/notifications
        # - Update related records
        
        return new_case
    
    def upload_document(self, customer_id: str, file_content: bytes, filename: str, document_type: str = "Document") -> Document:
        """
        Upload a document to Salesforce.
        
        In production, this would:
        1. Upload file to Salesforce ContentVersion/ContentDocument
        2. Link document to customer Account via ContentDocumentLink
        3. Handle file size limits and validation
        4. Return Salesforce document ID
        
        For MVP, we simulate by:
        - Saving file to mock directory
        - Generating a mock document ID
        - Creating document record in Salesforce format
        - Appending to documents JSON file
        - Returning the created document
        """
        import uuid
        import mimetypes
        
        # Generate mock document ID (in production, Salesforce returns this)
        document_id = f"069{str(uuid.uuid4()).replace('-', '')[:15]}"
        
        # Determine file type from extension if not provided
        file_ext = Path(filename).suffix.lower()
        if not document_type or document_type == "Document":
            if file_ext in ['.pdf']:
                document_type = "PDF"
            elif file_ext in ['.jpg', '.jpeg', '.png', '.gif']:
                document_type = "Image"
            elif file_ext in ['.doc', '.docx']:
                document_type = "Word Document"
            elif file_ext in ['.xls', '.xlsx']:
                document_type = "Spreadsheet"
            else:
                document_type = "Document"
        
        # Save file to mock directory
        pdf_filename = f"{document_id}.pdf"
        # For simplicity, we'll save all files as PDFs in the mock
        # In production, we'd preserve the original file format
        file_path = self.mock_data_dir / pdf_filename
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Create document object
        created_date = datetime.now()
        download_url = f"/customer/documents/{document_id}/download"
        
        new_document = Document(
            document_id=document_id,
            customer_id=customer_id,
            name=filename,
            type=document_type,
            download_url=download_url,
            created_date=created_date
        )
        
        # ============================================
        # MAPPING LOGIC: Transform to Salesforce format
        # ============================================
        # This demonstrates how we would map our internal DTO to Salesforce format
        salesforce_document_data = {
            "Id": new_document.document_id,
            "Title": new_document.name,
            "FileExtension": file_ext.lstrip('.') if file_ext else "",
            "ContentSize": len(file_content),
            "ContentUrl": download_url,
            "FirstPublishLocationId": customer_id,  # Link to Account
            "CreatedDate": new_document.created_date.isoformat(),
            "Type": new_document.type
        }
        
        # Send to Salesforce Mock Endpoint
        new_document_file = self.mock_data_dir / "new-document.json"
        with open(new_document_file, 'w', encoding='utf-8') as f:
            json.dump({
                "success": True,
                "id": salesforce_document_data["Id"],
                "salesforce_document": salesforce_document_data
            }, f, indent=2, ensure_ascii=False)
        
        # Log to console to make mapping logic visible
        print("\n" + "="*60)
        print("SALESFORCE MOCK ENDPOINT: New Document Uploaded")
        print("="*60)
        print(f"Mapping from internal DTO to Salesforce format:")
        print(f"  Document ID: '{new_document.document_id}'")
        print(f"  Customer ID: '{new_document.customer_id}' → Salesforce AccountId: '{salesforce_document_data['FirstPublishLocationId']}'")
        print(f"  File Name: '{new_document.name}' → Salesforce Title: '{salesforce_document_data['Title']}'")
        print(f"  File Size: {salesforce_document_data['ContentSize']} bytes")
        print(f"\nSalesforce Document Data:")
        print(json.dumps(salesforce_document_data, indent=2, ensure_ascii=False))
        print("="*60 + "\n")
        
        # Update documents JSON file
        mock_file = self.mock_data_dir / f"documents-{customer_id}.json"
        if mock_file.exists():
            with open(mock_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {"documents": []}
        
        # Append new document
        data['documents'].append({
            "document_id": new_document.document_id,
            "customer_id": new_document.customer_id,
            "name": new_document.name,
            "type": new_document.type,
            "download_url": new_document.download_url,
            "created_date": new_document.created_date.isoformat()
        })
        
        # Write back to mock file
        with open(mock_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # In production, we would also:
        # - Upload file to Salesforce ContentVersion
        # - Create ContentDocumentLink to associate with Account
        # - Handle file versioning
        # - Trigger notifications/webhooks
        
        return new_document