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
        - Appending to mock file
        - Returning the created case
        """
        # Generate mock case ID (in production, Salesforce returns this)
        import uuid
        case_id = f"500{str(uuid.uuid4()).replace('-', '')[:15]}"
        
        # Create case object
        new_case = Case(
            case_id=case_id,
            customer_id=customer_id,
            subject=case_request.subject,
            description=case_request.description,
            type="Customer Request",
            status="New",
            created_date=datetime.now()
        )
        
        # In production: POST to Salesforce API
        # For MVP: Append to mock file
        mock_file = self.mock_data_dir / f"cases-{customer_id}.json"
        
        if mock_file.exists():
            with open(mock_file, 'r') as f:
                data = json.load(f)
        else:
            data = {"cases": []}
        
        # Append new case
        data['cases'].append({
            "case_id": new_case.case_id,
            "customer_id": new_case.customer_id,
            "subject": new_case.subject,
            "description": new_case.description,
            "type": new_case.type,
            "status": new_case.status,
            "created_date": new_case.created_date.isoformat()
        })
        
        # Write back to mock file
        with open(mock_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        # In production, we would also:
        # - Log the case creation
        # - Trigger webhooks/notifications
        # - Update related records
        
        return new_case
