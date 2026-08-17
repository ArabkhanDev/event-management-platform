package com.auda.service;

import com.auda.dao.entity.Question;
import com.auda.model.enums.QuestionStatus;
import com.auda.model.request.SubmitQuestionRequest;

import java.util.List;

public interface QuestionService {

    Question submit(Long sessionId, SubmitQuestionRequest request);

    List<Question> listForSession(Long sessionId, Long requesterId);

    Question updateStatus(Long id, Long requesterId, QuestionStatus newStatus);
}
