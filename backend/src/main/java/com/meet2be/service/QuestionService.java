package com.meet2be.service;

import com.meet2be.dao.entity.Question;
import com.meet2be.model.enums.QuestionStatus;
import com.meet2be.model.request.SubmitQuestionRequest;

import java.util.List;

public interface QuestionService {

    Question submit(Long sessionId, SubmitQuestionRequest request);

    List<Question> listForSession(Long sessionId, Long requesterId);

    Question updateStatus(Long id, Long requesterId, QuestionStatus newStatus);
}
